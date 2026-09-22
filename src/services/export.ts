import "server-only";

/**
 * "Export My Data" (PROJECT spec §21). Every query here goes through the
 * caller's RLS-scoped client, so this can only ever export a care profile
 * the requesting user actually has access to — there's no separate
 * authorization check because Postgres itself won't return rows otherwise.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function exportCareProfileData(supabase: Client, careProfileId: string) {
  const tables = [
    "care_profiles",
    "triggers",
    "support_strategies",
    "profile_preferences",
    "sensor_readings",
    "baseline_metrics",
    "events",
    "observations",
    "ai_insights",
    "daily_summaries",
    "weekly_reports",
  ] as const;

  const results = await Promise.all(
    tables.map(async (table) => {
      const query =
        table === "care_profiles"
          ? supabase.from(table).select("*").eq("id", careProfileId)
          : supabase.from(table).select("*").eq("care_profile_id", careProfileId);
      const { data, error } = await query;
      if (error) throw new Error(`Export failed on ${table}: ${error.message}`);
      return [table, data] as const;
    })
  );

  const { data: conversations } = await supabase.from("ai_conversations").select("*").eq("care_profile_id", careProfileId);
  const conversationIds = (conversations ?? []).map((c) => c.id);
  const { data: messages } = conversationIds.length
    ? await supabase.from("ai_messages").select("*").in("conversation_id", conversationIds)
    : { data: [] };

  return {
    exportedAt: new Date().toISOString(),
    ...Object.fromEntries(results),
    ai_conversations: conversations ?? [],
    ai_messages: messages ?? [],
  };
}
