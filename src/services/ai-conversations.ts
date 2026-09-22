import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function getMostRecentConversation(supabase: Client, careProfileId: string) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, title, created_at")
    .eq("care_profile_id", careProfileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load conversation: ${error.message}`);
  return data;
}
