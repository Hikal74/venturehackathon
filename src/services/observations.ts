import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CreateObservationInput } from "@/lib/validation/observation";
import { getOpenEvent } from "./events";

type Client = SupabaseClient<Database>;
type ObservationRow = Database["public"]["Tables"]["observations"]["Row"];

export async function createObservation(
  supabase: Client,
  authorId: string,
  input: CreateObservationInput
): Promise<ObservationRow> {
  // If there's a currently open event for this profile, auto-link this
  // observation to it (unless the caregiver explicitly chose a different
  // one) — this is what lets Pattern Discovery associate context like
  // "crowded cafeteria" with a specific elevated episode automatically.
  const eventId = input.eventId ?? (await getOpenEvent(supabase, input.careProfileId))?.id ?? null;

  const { data, error } = await supabase
    .from("observations")
    .insert({
      care_profile_id: input.careProfileId,
      author_id: authorId,
      occurred_at: input.occurredAt ? new Date(input.occurredAt).toISOString() : new Date().toISOString(),
      environment: input.environment,
      activity: input.activity,
      possible_trigger: input.possibleTrigger,
      support_action: input.supportAction,
      notes: input.notes,
      outcome: input.outcome,
      event_id: eventId,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(`Failed to save observation: ${error?.message}`);
  return data;
}

export async function listObservationsInRange(
  supabase: Client,
  careProfileId: string,
  start: Date,
  end: Date
): Promise<ObservationRow[]> {
  const { data, error } = await supabase
    .from("observations")
    .select("*")
    .eq("care_profile_id", careProfileId)
    .gte("occurred_at", start.toISOString())
    .lte("occurred_at", end.toISOString())
    .order("occurred_at", { ascending: true });
  if (error) throw new Error(`Failed to load observations: ${error.message}`);
  return data ?? [];
}
