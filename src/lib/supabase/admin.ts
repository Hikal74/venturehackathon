import "server-only";

/**
 * Service-role Supabase client — BYPASSES Row Level Security entirely.
 *
 * Use this ONLY for operations that legitimately need to act outside a
 * single user's RLS scope, and ONLY from trusted server code:
 *   - the device-ingestion endpoint (a wearable/simulator authenticates
 *     with a per-profile device token, not a Supabase user session, so
 *     there's no `auth.uid()` for RLS to check against)
 *   - scheduled/derived-data writers (baseline recomputation, pattern
 *     detection) that need to read/write across the data they compute from
 *
 * Every function that uses this client MUST manually verify the caller is
 * authorized for the specific `care_profile_id` it's touching — this client
 * will happily read or write ANY row in the database if you let it.
 *
 * This module must never be imported by a "use client" file or any code
 * that ends up in the browser bundle. The `server-only` import above makes
 * that a build-time error, not just a convention.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getServerEnv } from "@/lib/env";

export function createAdminClient() {
  const env = getServerEnv();
  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
