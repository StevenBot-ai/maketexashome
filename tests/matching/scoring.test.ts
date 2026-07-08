import { describe, it, expect } from "vitest";
import { scoreCommunities } from "../../lib/matching/scoring";
import type { CommunityMatchData, MoverPriorities } from "../../lib/matching/types";

function community(overrides: Partial<CommunityMatchData>): CommunityMatchData {
  return {
    id: "TST",
    name: "Test Town",
    tagline: null,
    publicationId: null,
    publicationDomain: null,
    latitude: null,
    longitude: null,
    lakeScore: null,
    outdoorScore: null,
    paceValue: null,
    festivalScore: null,
    schoolScore: null,
    proximityMilesToChosen: null,
    ...overrides,
  };
}

describe("scoreCommunities", () => {
  it("ranks a community with a perfect lake score above one with none, when lake access is a max priority", () => {
    const priorities: MoverPriorities = { lakeAccess: 5 };
    const communities = [
      community({ id: "A", lakeScore: 1.0 }),
      community({ id: "B", lakeScore: 0.0 }),
    ];

    const results = scoreCommunities(priorities, communities);

    expect(results[0].communityId).toBe("A");
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("does not penalize a community for missing data on a dimension the mover set (graceful degradation)", () => {
    // schoolPriority is set, but no community has school data yet in Phase 1.
    const priorities: MoverPriorities = { lakeAccess: 5, schoolPriority: 5 };
    const communities = [
      community({ id: "A", lakeScore: 1.0, schoolScore: null }),
      community({ id: "B", lakeScore: 0.0, schoolScore: null }),
    ];

    const results = scoreCommunities(priorities, communities);
    const a = results.find((r) => r.communityId === "A")!;

    // A should score a full 1.0 on lake, and the missing school dimension
    // must not drag the score down - it should simply be excluded.
    expect(a.score).toBe(1.0);

    const schoolFactor = a.factorBreakdown.find((f) => f.factor === "schoolPriority")!;
    expect(schoolFactor.communityScore).toBeNull();
    expect(schoolFactor.contribution).toBe(0);
  });

  it("only averages sliders the mover actually set", () => {
    // Mover only cares about lakes. Outdoor/pace/festival/school must not
    // factor into the score at all, even though the data exists.
    const priorities: MoverPriorities = { lakeAccess: 5 };
    const communities = [
      community({ id: "A", lakeScore: 1.0, outdoorScore: 0.0, festivalScore: 0.0 }),
    ];

    const results = scoreCommunities(priorities, communities);

    expect(results[0].score).toBe(1.0);
    expect(results[0].factorBreakdown).toHaveLength(1);
    expect(results[0].factorBreakdown[0].factor).toBe("lakeAccess");
  });

  it("scores pace of life bidirectionally: a quiet-seeking mover matches a quiet community, not a lively one", () => {
    const quietSeeker: MoverPriorities = { paceOfLife: 1 };
    const communities = [
      community({ id: "QUIET", paceValue: 0.0 }),
      community({ id: "LIVELY", paceValue: 1.0 }),
    ];

    const results = scoreCommunities(quietSeeker, communities);
    const quiet = results.find((r) => r.communityId === "QUIET")!;
    const lively = results.find((r) => r.communityId === "LIVELY")!;

    expect(quiet.score).toBeGreaterThan(lively.score);
  });

  it("weights importance sliders by their 1-5 value, not just on/off", () => {
    // Two identical communities, but a stronger lake preference (5) should
    // pull the score closer to the community's actual lake score than a
    // weaker one (1) would when combined with an unset second dimension.
    const strongPreference: MoverPriorities = { lakeAccess: 5, outdoorAccess: 1 };
    const weakPreference: MoverPriorities = { lakeAccess: 1, outdoorAccess: 5 };
    const communities = [
      community({ id: "A", lakeScore: 1.0, outdoorScore: 0.0 }),
    ];

    const strong = scoreCommunities(strongPreference, communities)[0];
    const weak = scoreCommunities(weakPreference, communities)[0];

    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it("adds a proximity bonus when close to the chosen community, tapering with distance", () => {
    const priorities: MoverPriorities = { closeToCommunityId: "FWS" };
    const communities = [
      community({ id: "NEAR", proximityMilesToChosen: 10 }),
      community({ id: "FAR", proximityMilesToChosen: 90 }),
    ];

    const results = scoreCommunities(priorities, communities);
    const near = results.find((r) => r.communityId === "NEAR")!;
    const far = results.find((r) => r.communityId === "FAR")!;

    expect(near.score).toBeGreaterThan(far.score);
  });

  it("returns results sorted by score descending", () => {
    const priorities: MoverPriorities = { lakeAccess: 5 };
    const communities = [
      community({ id: "LOW", lakeScore: 0.2 }),
      community({ id: "HIGH", lakeScore: 0.9 }),
      community({ id: "MID", lakeScore: 0.5 }),
    ];

    const results = scoreCommunities(priorities, communities);

    expect(results.map((r) => r.communityId)).toEqual(["HIGH", "MID", "LOW"]);
  });

  it("ranks a community with a higher school score above one with a lower score, when school priority is set", () => {
    const priorities: MoverPriorities = { schoolPriority: 5 };
    const communities = [
      community({ id: "GOOD", schoolScore: 0.9 }),
      community({ id: "POOR", schoolScore: 0.2 }),
    ];

    const results = scoreCommunities(priorities, communities);

    expect(results[0].communityId).toBe("GOOD");
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("community with null school score is not penalized when mover sets school priority", () => {
    // One community has real school data; one has none yet.
    // The one without data must not score below the one with poor data.
    const priorities: MoverPriorities = { schoolPriority: 5 };
    const communities = [
      community({ id: "DATA", schoolScore: 0.3 }),   // real but poor score
      community({ id: "NONE", schoolScore: null }),   // no data at all
    ];

    const results = scoreCommunities(priorities, communities);
    const dataResult = results.find((r) => r.communityId === "DATA")!;
    const noneResult = results.find((r) => r.communityId === "NONE")!;

    // NONE must not score lower than DATA -- missing data is excluded, not penalized.
    // With only school priority set: DATA scores (weight * 0.3) / weight = 0.3
    // NONE scores 0 / 0 = 0.5 (the neutral fallback when denominator is 0)
    expect(noneResult.score).toBeGreaterThanOrEqual(dataResult.score);

    const noneFactor = noneResult.factorBreakdown.find((f) => f.factor === "schoolPriority")!;
    expect(noneFactor.communityScore).toBeNull();
    expect(noneFactor.contribution).toBe(0);
  });
});
