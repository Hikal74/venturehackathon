import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getActiveCareProfile } from "@/lib/care-profile/active";

/**
 * Resolves the current user + their care profiles + which one is active,
 * once per request. `(app)/layout.tsx` and every page inside it need this
 * same data; without `cache()`, each would independently re-hit Supabase
 * for the same session and profile list on every request. React's
 * request-scoped memoization (new in the App Router) means all of those
 * calls collapse into one, as long as they happen during the same render.
 */
export const getSessionContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null, active: null, all: [] };
  }

  const [{ data: profile }, { active, all }] = await Promise.all([
    supabase.from("profiles").select("display_name, role").eq("id", user.id).maybeSingle(),
    getActiveCareProfile(supabase),
  ]);

  return { supabase, user, profile, active, all };
});
