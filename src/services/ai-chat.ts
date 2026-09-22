import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { buildAuraAiContext } from "@/lib/ai/context-builder";
import { generateStructured } from "@/lib/ai/gemini-client";
import { chatResponseSchema } from "@/lib/ai/response-schema";

type Client = SupabaseClient<Database>;
type AiMessageRow = Database["public"]["Tables"]["ai_messages"]["Row"];

const HISTORY_LIMIT = 12;

export async function getOrCreateConversation(
  supabase: Client,
  careProfileId: string,
  userId: string,
  conversationId?: string | null
): Promise<string> {
  if (conversationId) {
    const { data } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("care_profile_id", careProfileId)
      .maybeSingle();
    if (data) return data.id;
  }

  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({ care_profile_id: careProfileId, user_id: userId, title: null })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Failed to start conversation: ${error?.message}`);
  return data.id;
}

export async function getConversationMessages(supabase: Client, conversationId: string): Promise<AiMessageRow[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load messages: ${error.message}`);
  return data ?? [];
}

export type ChatResult =
  | { ok: true; reply: string; confidenceNote: string | null; conversationId: string }
  | { ok: false; reason: string; conversationId: string };

/**
 * Sends one chat turn through Aura AI. Unlike a generic chatbot, this
 * always rebuilds the full profile context (lib/ai/context-builder.ts) for
 * every turn — Gemini itself is stateless between calls, so "knowing about
 * this person" only holds if we resend that context (plus recent turns)
 * every single time.
 */
export async function sendChatMessage(
  supabase: Client,
  careProfileId: string,
  userId: string,
  userMessage: string,
  conversationId?: string | null
): Promise<ChatResult> {
  const resolvedConversationId = await getOrCreateConversation(supabase, careProfileId, userId, conversationId);

  await supabase.from("ai_messages").insert({
    conversation_id: resolvedConversationId,
    role: "user",
    content: userMessage,
  });

  const [context, history] = await Promise.all([
    buildAuraAiContext(supabase, careProfileId),
    getConversationMessages(supabase, resolvedConversationId),
  ]);

  const recentHistory = history.slice(-HISTORY_LIMIT - 1, -1); // exclude the message we just inserted

  const prompt = `A caregiver is chatting with you about this specific AuraLink Care profile. Answer their latest message using ONLY the CONTEXT below plus the conversation so far. Fill the required JSON schema.

CONTEXT:
${JSON.stringify(context, null, 2)}

CONVERSATION SO FAR:
${recentHistory.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n") || "(no earlier messages)"}

LATEST MESSAGE FROM CAREGIVER:
${userMessage}`;

  const result = await generateStructured(chatResponseSchema, prompt);

  if (!result.ok) {
    return { ok: false, reason: result.reason, conversationId: resolvedConversationId };
  }

  await supabase.from("ai_messages").insert({
    conversation_id: resolvedConversationId,
    role: "assistant",
    content: result.data.reply,
    structured_payload: { confidenceAndLimitations: result.data.confidenceAndLimitations },
  });

  // Best-effort title for the conversation list, from the first exchange.
  if (recentHistory.length === 0) {
    await supabase
      .from("ai_conversations")
      .update({ title: userMessage.slice(0, 80) })
      .eq("id", resolvedConversationId);
  }

  return {
    ok: true,
    reply: result.data.reply,
    confidenceNote: result.data.confidenceAndLimitations,
    conversationId: resolvedConversationId,
  };
}
