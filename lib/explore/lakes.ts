import { createServiceClient } from "../supabase/service";

export interface Lake {
  id: string;
  name: string;
  alias: string | null;
  vibe: string | null;
  county: string | null;
  city_nearest: string | null;
  the_lines: string | null;
  fishing_grade: string | null;
  rec_access_grade: string | null;
  content_hook: string | null;
  primary_access: string | null;
  managing_agency: string | null;
}

export async function fetchLakes(filters: { county?: string } = {}): Promise<Lake[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from("lakes")
    .select("id, name, alias, vibe, county, city_nearest, the_lines, fishing_grade, rec_access_grade, content_hook, primary_access, managing_agency")
    .order("name");

  if (filters.county) {
    query = query.eq("county", filters.county);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchLakeCounties(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("lakes")
    .select("county")
    .not("county", "is", null)
    .order("county");
  if (error) throw error;
  const counties = [...new Set((data ?? []).map((r) => r.county as string))];
  return counties.sort();
}
