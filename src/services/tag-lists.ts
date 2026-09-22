import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;
type TagTable = "triggers" | "support_strategies";

export async function addTag(supabase: Client, table: TagTable, careProfileId: string, label: string): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) return;
  const { error } = await supabase.from(table).insert({ care_profile_id: careProfileId, label: trimmed, is_custom: true });
  if (error) throw new Error(`Failed to add ${table === "triggers" ? "trigger" : "support strategy"}: ${error.message}`);
}

export async function removeTag(supabase: Client, table: TagTable, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(`Failed to remove entry: ${error.message}`);
}
