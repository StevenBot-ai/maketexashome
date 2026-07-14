import { createServiceClient } from "../supabase/service";

export interface Park {
  id: string;
  name: string;
  alias: string | null;
  category: string | null;
  park_type: string | null;
  county: string | null;
  city_nearest: string | null;
  acreage: number | null;
  has_camping: boolean | null;
  water_access: boolean | null;
  fee_required: boolean | null;
  website_url: string | null;
  managing_agency: string | null;
}

// Maps raw park_type codes to human-readable filter labels.
// Multiple codes map to the same label (e.g. NHS/NHP/NM/... all -> "Historic/Monument").
export const PARK_TYPE_LABELS: Record<string, string> = {
  SP: "State Park",
  NP: "National Park",
  NF: "National Forest",
  NRA: "National Recreation Area",
  NWR: "Wildlife Refuge",
  NHS: "Historic/Monument",
  NHP: "Historic/Monument",
  NM: "Historic/Monument",
  NMEM: "Historic/Monument",
  NS: "Historic/Monument",
  SHS: "Historic/Monument",
  SNA: "Historic/Monument",
};

// Ordered list for rendering the filter UI.
export const PARK_TYPE_FILTER_OPTIONS = [
  "State Park",
  "National Park",
  "National Forest",
  "National Recreation Area",
  "Wildlife Refuge",
  "Historic/Monument",
  "Other",
];

// Returns the park_type codes that match a given human-readable label.
function codesForLabel(label: string): string[] {
  if (label === "Other") {
    const known = new Set(Object.keys(PARK_TYPE_LABELS));
    // "Other" means any code not in the map -- handled via .not() in the query
    return [];
  }
  return Object.entries(PARK_TYPE_LABELS)
    .filter(([, v]) => v === label)
    .map(([k]) => k);
}

export async function fetchParks(
  filters: {
    parkTypeLabel?: string;
    camping?: boolean;
    water?: boolean;
    feeFree?: boolean;
  } = {}
): Promise<Park[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from("parks")
    .select("id, name, alias, category, park_type, county, city_nearest, acreage, has_camping, water_access, fee_required, website_url, managing_agency")
    .order("name");

  if (filters.parkTypeLabel) {
    if (filters.parkTypeLabel === "Other") {
      const knownCodes = Object.keys(PARK_TYPE_LABELS);
      query = query.not("park_type", "in", `(${knownCodes.join(",")})`);
    } else {
      const codes = codesForLabel(filters.parkTypeLabel);
      if (codes.length === 1) {
        query = query.eq("park_type", codes[0]);
      } else if (codes.length > 1) {
        query = query.in("park_type", codes);
      }
    }
  }

  if (filters.camping === true) query = query.eq("has_camping", true);
  if (filters.water === true) query = query.eq("water_access", true);
  if (filters.feeFree === true) query = query.eq("fee_required", false);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
