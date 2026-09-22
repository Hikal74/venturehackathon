import "server-only";

/**
 * Server-side Supabase client, scoped to the current request's session
 * cookies. This is what every server component, server action, and API
 * route should use for reads/writes performed "as the logged-in user" —
 * it respects Row Level Security exactly as if the request came from the
 * browser, so it's the safe default (as opposed to the admin client).
 *
 * Must be created fresh per request (per Supabase SSR guidance) — never
 * cached at module scope.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component that can't set cookies directly.
            // Harmless as long as the proxy (src/proxy.ts) is also refreshing
            // the session — see that file for why this fallback is safe.
          }
        },
      },
    }
  );
}
