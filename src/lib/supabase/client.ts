"use client";

/**
 * Browser-side Supabase client.
 *
 * Uses only the public URL and anon key (safe to expose — the anon key is
 * meant to be public and is constrained entirely by Row Level Security
 * policies in Postgres). Never import the service-role client (`admin.ts`)
 * from a "use client" file; that key must stay server-only.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
