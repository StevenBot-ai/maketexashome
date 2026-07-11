import { createServiceClient } from "../supabase/service";
import type { CommunityMatchData } from "./types";

export interface CommunityOption {
  id: string;
  name: string;
}

// Used by the quiz page's server-side render to populate the "close to"
// dropdown - kept separate from fetchCommunityMatchData since it needs no
// scoring inputs, just id/name for a <select>.
export async function fetchCommunityOptions(): Promise<CommunityOption[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("communities")
    .select("id, name")
    .eq("geographic_scale", "C")
    .eq("is_live", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

function minMaxNormalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5); // no variance - neutral
  return values.map((v) => (v - min) / (max - min));
}

export async function fetchCommunityMatchData(
  closeToCommunityId?: string
): Promise<CommunityMatchData[]> {
  const supabase = createServiceClient();

  const { data: communities, error: communitiesError } = await supabase
    .from("communities")
    .select("id, name, tagline, publication_id, geographic_scale, latitude, longitude, school_score")
    .eq("geographic_scale", "C") // city-level only, matches run_queue's existing scoping convention
    .eq("is_live", true); // excludes communities toggled off in control_board

  if (communitiesError) throw communitiesError;

  const { data: publications, error: pubError } = await supabase
    .from("publications")
    .select("id, domain");

  if (pubError) throw pubError;

  const publicationDomains = new Map(
    (publications ?? []).map((p) => [p.id, p.domain])
  );

  const { data: relationships, error: relError } = await supabase
    .from("comm_relationships")
    .select(
      "host_id, lake_id, lake_proximity_miles, lake_is_primary_anchor, park_id, park_proximity_miles, festival_id:fest_id, fest_proximity_miles, neighbor_id, neighbor_miles"
    );

  if (relError) throw relError;

  const { data: festivals, error: festError } = await supabase
    .from("festivals")
    .select("id, avg_attendance");

  if (festError) throw festError;

  const festivalAttendance = new Map(
    (festivals ?? []).map((f) => [f.id, f.avg_attendance ?? 0])
  );

  const rawLake: Record<string, number> = {};
  const rawOutdoor: Record<string, number> = {};
  const rawFestival: Record<string, number> = {};
  const proximityToChosen: Record<string, number | null> = {};

  for (const c of communities ?? []) {
    rawLake[c.id] = 0;
    rawOutdoor[c.id] = 0;
    rawFestival[c.id] = 0;
    proximityToChosen[c.id] = null;
  }

  for (const rel of relationships ?? []) {
    const hostId = rel.host_id;
    if (!(hostId in rawLake)) continue;

    if (rel.lake_id) {
      const proximityComponent =
        rel.lake_proximity_miles != null
          ? Math.max(0, 1 - rel.lake_proximity_miles / 50)
          : 0;
      const anchorBonus = rel.lake_is_primary_anchor ? 1 : 0;
      rawLake[hostId] = Math.max(rawLake[hostId], anchorBonus + proximityComponent);
    }

    if (rel.park_id) {
      const proximityComponent =
        rel.park_proximity_miles != null
          ? Math.max(0, 1 - rel.park_proximity_miles / 50)
          : 0;
      rawOutdoor[hostId] = Math.max(rawOutdoor[hostId], proximityComponent);
    }

    if (rel.festival_id) {
      const attendance = festivalAttendance.get(rel.festival_id) ?? 0;
      const proximityComponent =
        rel.fest_proximity_miles != null
          ? Math.max(0, 1 - rel.fest_proximity_miles / 50)
          : 0;
      rawFestival[hostId] = Math.max(
        rawFestival[hostId],
        proximityComponent + Math.min(1, attendance / 10000)
      );
    }

    if (
      closeToCommunityId &&
      rel.neighbor_id === closeToCommunityId &&
      rel.neighbor_miles != null
    ) {
      proximityToChosen[hostId] = rel.neighbor_miles;
    }
  }

  if (closeToCommunityId) {
    proximityToChosen[closeToCommunityId] = 0; // the chosen community itself is zero miles from itself
  }

  const ids = (communities ?? []).map((c) => c.id);
  const lakeNormalized = minMaxNormalize(ids.map((id) => rawLake[id]));
  const outdoorNormalized = minMaxNormalize(ids.map((id) => rawOutdoor[id]));
  const festivalNormalized = minMaxNormalize(ids.map((id) => rawFestival[id]));
  // Pace value: MVP proxy using festival density alone until Phase 3 population
  // data exists (see design spec Phasing section, Phase 3). Documented
  // limitation, not a silent guess: revisit once real population data lands.
  const paceNormalized = festivalNormalized;

  return (communities ?? []).map((c, i) => ({
    id: c.id,
    name: c.name,
    tagline: c.tagline,
    publicationId: c.publication_id,
    publicationDomain: c.publication_id
      ? publicationDomains.get(c.publication_id) ?? null
      : null,
    latitude: c.latitude,
    longitude: c.longitude,
    lakeScore: lakeNormalized[i],
    outdoorScore: outdoorNormalized[i],
    paceValue: paceNormalized[i],
    festivalScore: festivalNormalized[i],
    schoolScore: (c as any).school_score ?? null,
    proximityMilesToChosen: proximityToChosen[c.id],
  }));
}
