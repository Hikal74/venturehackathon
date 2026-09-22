import "server-only";

/**
 * Merges sensor-driven events, caregiver observations, and Aura AI insights
 * into one chronological timeline for a day (PROJECT spec §15). Each source
 * is a real table query — this is composition, not a separate data model.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { listEventsInRange } from "./events";
import { listObservationsInRange } from "./observations";
import { STATE_META, type CareProfileState } from "@/types/domain";

type Client = SupabaseClient<Database>;

export type TimelineEntryKind = "event_start" | "event_end" | "observation" | "ai_insight";

export interface TimelineEntry {
  time: string;
  kind: TimelineEntryKind;
  title: string;
  description?: string;
}

export async function getTimelineForDay(supabase: Client, careProfileId: string, dayStart: Date): Promise<TimelineEntry[]> {
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  const [events, observations, { data: insights }] = await Promise.all([
    listEventsInRange(supabase, careProfileId, dayStart, dayEnd),
    listObservationsInRange(supabase, careProfileId, dayStart, dayEnd),
    supabase
      .from("ai_insights")
      .select("kind, generated_at, content")
      .eq("care_profile_id", careProfileId)
      .gte("generated_at", dayStart.toISOString())
      .lte("generated_at", dayEnd.toISOString())
      .order("generated_at", { ascending: true }),
  ]);

  const entries: TimelineEntry[] = [];

  for (const event of events) {
    const meta = STATE_META[event.state as CareProfileState];
    if (new Date(event.started_at) >= dayStart) {
      entries.push({
        time: event.started_at,
        kind: "event_start",
        title: `${meta?.label ?? event.state} detected`,
        description: `Baseline deviation score ${event.deviation_score.toFixed(2)}`,
      });
    }
    if (event.ended_at && new Date(event.ended_at) <= dayEnd) {
      entries.push({
        time: event.ended_at,
        kind: "event_end",
        title: "Signals returned toward baseline",
      });
    }
  }

  for (const obs of observations) {
    const parts = [obs.environment, obs.activity].filter(Boolean).join(" — ");
    entries.push({
      time: obs.occurred_at,
      kind: "observation",
      title: parts ? `Caregiver observation: ${parts}` : "Caregiver observation",
      description: [obs.possible_trigger && `Possible trigger: ${obs.possible_trigger}`, obs.support_action && `Support action: ${obs.support_action}`, obs.notes, obs.outcome && `Outcome: ${obs.outcome}`]
        .filter(Boolean)
        .join(" · "),
    });
  }

  for (const insight of insights ?? []) {
    const content = insight.content as Record<string, unknown> | null;
    entries.push({
      time: insight.generated_at,
      kind: "ai_insight",
      title: insight.kind === "what_changed" ? "Aura AI: What Changed" : "Aura AI insight",
      description: content && typeof content.currentObservation === "string" ? content.currentObservation : undefined,
    });
  }

  return entries.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}
