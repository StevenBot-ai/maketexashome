import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only. Never import this file from a Client Component.
// Used to read SEIS's editorial tables (communities, comm_relationships,
// parks, lakes, festivals) - those tables have RLS enabled with no anon
// policies, so this key never leaves the server (not a NEXT_PUBLIC_ var,
// never sent to the browser, never visible in dev tools or network requests
// the browser makes) - same isolation pattern control_board uses in SEIS.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
