export type SliderValue = 1 | 2 | 3 | 4 | 5;

export interface MoverPriorities {
  lakeAccess?: SliderValue;
  outdoorAccess?: SliderValue;
  paceOfLife?: SliderValue; // 1 = quiet/low-key, 5 = lively/active
  festivalCulture?: SliderValue;
  schoolPriority?: SliderValue;
  closeToCommunityId?: string;
}

// One row of pre-computed, normalized (0-1) signal per community.
// null means "no data for this dimension yet" (graceful degradation),
// as opposed to 0 which means "real data, and it's a poor fit."
export interface CommunityMatchData {
  id: string;
  name: string;
  tagline: string | null;
  publicationId: string | null;
  publicationDomain: string | null; // e.g. "grandprairieshoutouts.com" - null until Steven backfills publications.domain
  latitude: number | null;
  longitude: number | null;
  lakeScore: number | null;
  outdoorScore: number | null;
  paceValue: number | null; // 0 = quiet, 1 = lively (community's own intrinsic value)
  festivalScore: number | null;
  schoolScore: number | null; // always null in Phase 1 - no school data exists yet
  proximityMilesToChosen: number | null; // null if no closeToCommunityId set, or no relationship data
}

export type MatchFactor =
  | "lakeAccess"
  | "outdoorAccess"
  | "paceOfLife"
  | "festivalCulture"
  | "schoolPriority"
  | "proximity";

export interface FactorContribution {
  factor: MatchFactor;
  communityScore: number | null; // null = no data, excluded from this community's average
  contribution: number; // 0 if communityScore is null
}

export interface MatchResult {
  communityId: string;
  name: string;
  tagline: string | null;
  publicationId: string | null;
  publicationDomain: string | null;
  latitude: number | null;
  longitude: number | null;
  score: number; // 0-1
  factorBreakdown: FactorContribution[];
}
