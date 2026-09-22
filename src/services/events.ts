import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;
type EventRow = Database["public"]["Tables"]["events"]["Row"];

export async function getOpenEvent(supabase: Client, careProfileId: string): Promise<EventRow | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("care_profile_id", careProfileId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load open event: ${error.message}`);
  return data;
}

export async function listEventsInRange(
  supabase: Client,
  careProfileId: string,
  start: Date,
  end: Date
): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("care_profile_id", careProfileId)
    .lte("started_at", end.toISOString())
    .or(`ended_at.is.null,ended_at.gte.${start.toISOString()}`)
    .order("started_at", { ascending: true });
  if (error) throw new Error(`Failed to load events: ${error.message}`);
  return data ?? [];
}
