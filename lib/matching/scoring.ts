import type {
  CommunityMatchData,
  FactorContribution,
  MatchFactor,
  MatchResult,
  MoverPriorities,
  SliderValue,
} from "./types";

const PROXIMITY_BONUS_MAX = 0.15;
const PROXIMITY_TAPER_MILES = 100;

function normalizeSlider(value: SliderValue): number {
  // 1 -> 0, 5 -> 1
  return (value - 1) / 4;
}

function paceFit(sliderValue: SliderValue, communityPaceValue: number): number {
  const desired = normalizeSlider(sliderValue);
  return 1 - Math.abs(desired - communityPaceValue);
}

function proximityBonus(miles: number | null): number {
  if (miles === null) return 0;
  if (miles >= PROXIMITY_TAPER_MILES) return 0;
  return PROXIMITY_BONUS_MAX * (1 - miles / PROXIMITY_TAPER_MILES);
}

function scoreOneCommunity(
  priorities: MoverPriorities,
  community: CommunityMatchData
): MatchResult {
  const factorBreakdown: FactorContribution[] = [];
  let numerator = 0;
  let denominator = 0;

  const importanceFactors: Array<{
    factor: MatchFactor;
    slider: SliderValue | undefined;
    communityScore: number | null;
  }> = [
    { factor: "lakeAccess", slider: priorities.lakeAccess, communityScore: community.lakeScore },
    { factor: "outdoorAccess", slider: priorities.outdoorAccess, communityScore: community.outdoorScore },
    { factor: "festivalCulture", slider: priorities.festivalCulture, communityScore: community.festivalScore },
    { factor: "schoolPriority", slider: priorities.schoolPriority, communityScore: community.schoolScore },
  ];

  for (const { factor, slider, communityScore } of importanceFactors) {
    if (slider === undefined) continue; // mover didn't set this slider at all

    if (communityScore === null) {
      // Graceful degradation: data doesn't exist yet for this dimension.
      // Record it as evaluated-but-excluded, don't penalize the community.
      factorBreakdown.push({ factor, communityScore: null, contribution: 0 });
      continue;
    }

    const weight = normalizeSlider(slider) + 0.2; // keep a minimum weight so a "1" still counts a little
    numerator += weight * communityScore;
    denominator += weight;
    factorBreakdown.push({ factor, communityScore, contribution: weight * communityScore });
  }

  if (priorities.paceOfLife !== undefined) {
    if (community.paceValue === null) {
      factorBreakdown.push({ factor: "paceOfLife", communityScore: null, contribution: 0 });
    } else {
      const fit = paceFit(priorities.paceOfLife, community.paceValue);
      numerator += fit;
      denominator += 1;
      factorBreakdown.push({ factor: "paceOfLife", communityScore: community.paceValue, contribution: fit });
    }
  }

  const baseScore = denominator > 0 ? numerator / denominator : 0.5;

  const bonus = priorities.closeToCommunityId
    ? proximityBonus(community.proximityMilesToChosen)
    : 0;

  if (priorities.closeToCommunityId) {
    factorBreakdown.push({
      factor: "proximity",
      communityScore: community.proximityMilesToChosen,
      contribution: bonus,
    });
  }

  const score = Math.min(1, baseScore + bonus);

  return {
    communityId: community.id,
    name: community.name,
    tagline: community.tagline,
    publicationId: community.publicationId,
    publicationDomain: community.publicationDomain,
    latitude: community.latitude,
    longitude: community.longitude,
    score,
    factorBreakdown,
  };
}

export function scoreCommunities(
  priorities: MoverPriorities,
  communities: CommunityMatchData[]
): MatchResult[] {
  return communities
    .map((c) => scoreOneCommunity(priorities, c))
    .sort((a, b) => b.score - a.score);
}
