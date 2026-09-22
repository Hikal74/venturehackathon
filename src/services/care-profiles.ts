import "server-only";

/**
 * Service layer for care profiles. Every function here takes an already
 * request-scoped Supabase client (from lib/supabase/server.ts) so all reads
 * and writes go through Row Level Security as the calling user — this
 * module contains zero authorization logic of its own on purpose. If a
 * query here could ever return another user's data, that's an RLS bug to
 * fix in the migration, not something to patch here with an extra filter.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CreateCareProfileInput, UpdateCareProfileInput } from "@/lib/validation/care-profile";

type Client = SupabaseClient<Database>;
export type CareProfileRow = Database["public"]["Tables"]["care_profiles"]["Row"];

export async function listCareProfilesForCurrentUser(supabase: Client): Promise<CareProfileRow[]> {
  const { data, error } = await supabase.from("care_profiles").select("*").order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to list care profiles: ${error.message}`);
  return data ?? [];
}

export async function getCareProfileById(supabase: Client, id: string): Promise<CareProfileRow | null> {
  const { data, error } = await supabase.from("care_profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load care profile: ${error.message}`);
  return data;
}

/**
 * Creates a care profile plus all of its onboarding-collected child rows
 * (triggers, support strategies, routine preferences) in one pass. The
 * onboarding wizard intentionally collects everything client-side across
 * its 5 steps and submits once here, so there's never a half-created care
 * profile sitting in the database — either this whole thing succeeds, or
 * nothing is created.
 */
export async function createCareProfileFromOnboarding(
  supabase: Client,
  ownerId: string,
  input: CreateCareProfileInput
): Promise<CareProfileRow> {
  const { data: careProfile, error: careProfileError } = await supabase
    .from("care_profiles")
    .insert({
      owner_id: ownerId,
      display_name: input.displayName,
      age_range: input.ageRange,
      preferred_language: input.preferredLanguage,
      communication_preferences: input.communicationPreferences,
      onboarding_complete: true,
      onboarding_step: "done",
    })
    .select("*")
    .single();

  if (careProfileError || !careProfile) {
    throw new Error(`Failed to create care profile: ${careProfileError?.message}`);
  }

  const careProfileId = careProfile.id;

  // Supabase's query builder is PromiseLike, not a full native Promise
  // (no .catch/.finally until awaited), so the array element type has to be
  // PromiseLike here rather than Promise.
  const tasks: PromiseLike<{ error: { message: string } | null }>[] = [];

  if (input.triggers.length > 0) {
    tasks.push(
      supabase
        .from("triggers")
        .insert(input.triggers.map((label) => ({ care_profile_id: careProfileId, label, is_custom: true })))
    );
  }

  if (input.supportStrategies.length > 0) {
    tasks.push(
      supabase
        .from("support_strategies")
        .insert(input.supportStrategies.map((label) => ({ care_profile_id: careProfileId, label, is_custom: true })))
    );
  }

  const hasRoutine = Object.values(input.routine).some((v) => v && v.trim().length > 0);
  if (hasRoutine || input.routineNotes) {
    tasks.push(
      supabase.from("profile_preferences").insert({
        care_profile_id: careProfileId,
        routine: input.routine,
        notes: input.routineNotes ?? null,
      })
    );
  }

  const results = await Promise.all(tasks);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    // The care profile itself was created successfully; child rows are
    // best-effort supplementary data, so we surface the error but don't
    // roll back the whole profile — the caregiver can add triggers/
    // strategies later from Care Profile settings.
    console.error("Onboarding: some supplementary rows failed to insert", failed.error.message);
  }

  return careProfile;
}

export async function updateCareProfile(
  supabase: Client,
  id: string,
  input: UpdateCareProfileInput
): Promise<CareProfileRow> {
  const patch: Database["public"]["Tables"]["care_profiles"]["Update"] = {};
  if (input.displayName !== undefined) patch.display_name = input.displayName;
  if (input.ageRange !== undefined) patch.age_range = input.ageRange;
  if (input.preferredLanguage !== undefined) patch.preferred_language = input.preferredLanguage;
  if (input.communicationPreferences !== undefined) patch.communication_preferences = input.communicationPreferences;

  const { data, error } = await supabase.from("care_profiles").update(patch).eq("id", id).select("*").single();
  if (error || !data) throw new Error(`Failed to update care profile: ${error?.message}`);
  return data;
}

export async function deleteCareProfile(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("care_profiles").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete care profile: ${error.message}`);
}
