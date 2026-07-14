import { createServiceClient } from "../supabase/service";

export interface Festival {
  id: string;
  name: string;
  alias: string | null;
  category: string | null;
  city: string | null;
  month_held: number | null;
  recurrence_rule: string | null;
  avg_attendance: number | null;
  description: string | null;
  website_url: string | null;
}

// Index 0 unused; use MONTH_NAMES[month_held] where month_held is 1-12.
export const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Returns the top-level category segment (before the first "/").
// e.g. "Agriculture/Food" -> "Agriculture", "Music" -> "Music"
export function topCategory(category: string | null): string {
  if (!category) return "Other";
  return category.split("/")[0];
}

export async function fetchFestivals(
  filters: { month?: number; topCategory?: string } = {}
): Promise<Festival[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from("festivals")
    .select("id, name, alias, category, city, month_held, recurrence_rule, avg_attendance, description, website_url")
    .order("month_held", { nullsFirst: false })
    .order("name");

  if (filters.month != null) {
    query = query.eq("month_held", filters.month);
  }

  // Top-level category filter: fetch all then filter in JS since the DB
  // stores compound values like "Agriculture/Food" -- SQL LIKE would work
  // but requires a different query form. Filtering 391 rows in JS is fine.
  const { data, error } = await query;
  if (error) throw error;

  let results = data ?? [];

  if (filters.topCategory) {
    results = results.filter(
      (f) => topCategory(f.category) === filters.topCategory
    );
  }

  return results;
}
