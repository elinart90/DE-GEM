import { createClient } from '@supabase/supabase-js'

// SERVER-ONLY. Uses the service-role key, which BYPASSES Row Level Security.
// Never import this into a client component or anything bundled for the browser.
// Used in Phase 4 (checkout) so stock writes happen on the server, not in a
// customer's browser. Requires SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
