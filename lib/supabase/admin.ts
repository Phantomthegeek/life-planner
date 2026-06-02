import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Server-only admin client. Uses the service role key so it bypasses RLS.
// Only call this from server routes / server actions — never from the
// browser, and never import it from a client component.
//
// Use this for writes into shared / public-read tables (e.g. AI-generated
// course content) where the user-bound RLS policies don't grant write access
// but the server should be able to write on the user's behalf.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.'
    )
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
