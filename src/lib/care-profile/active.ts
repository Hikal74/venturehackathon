import "server-only";

/**
 * Resolves which care profile the current request should act on.
 *
 * A caregiver can own multiple care profiles (e.g. two children), but most
 * pages (dashboard, timeline, Aura AI, ...) operate on exactly one at a
 * time. We remember the choice in a plain cookie rather than in the
 * database — it's a per-browser UI preference, not data that needs to sync
 * across devices or be recoverable if lost.
 */
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { listCareProfilesForCurrentUser, type CareProfileRow } from "@/services/care-profiles";

const ACTIVE_CARE_PROFILE_COOKIE = "active_care_profile_id";

export async function getActiveCareProfile(
  supabase: SupabaseClient<Database>
): Promise<{ active: CareProfileRow | null; all: CareProfileRow[] }> {
  const all = await listCareProfilesForCurrentUser(supabase);
  if (all.length === 0) return { active: null, all };

  const cookieStore = await cookies();
  const requestedId = cookieStore.get(ACTIVE_CARE_PROFILE_COOKIE)?.value;

  const requested = requestedId ? all.find((p) => p.id === requestedId) : undefined;
  return { active: requested ?? all[0], all };
}

export { ACTIVE_CARE_PROFILE_COOKIE };
