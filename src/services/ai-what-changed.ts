import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { buildAuraAiContext } from "@/lib/ai/context-builder";
import { generateStructured } from "@/lib/ai/gemini-client";
import { whatChangedResponseSchema, type WhatChangedResponse } from "@/lib/ai/response-schema";

type Client = SupabaseClient<Database>;

export type WhatChangedResult =
  | { ok: true; response: WhatChangedResponse; generatedAt: string }
  | { ok: false; reason: string };

/**
 * The "What Changed?" pipeline (PROJECT spec §13): gather this profile's
 * current status + history via the context builder, ask Gemini to explain
 * the deviation using ONLY that context, validate the structured response,
 * and persist it as an `ai_insights` row so it shows up in the profile's
 * history even after the caregiver navigates away.
 */
export async function runWhatChanged(supabase: Client, careProfileId: string): Promise<WhatChangedResult> {
  const context = await buildAuraAiContext(supabase, careProfileId);

  const prompt = `A caregiver just pressed "What Changed?" for this AuraLink Care profile. Explain what changed in the signals right now compared to this person's baseline, using ONLY the CONTEXT below. Fill every field of the required JSON schema.

CONTEXT:
${JSON.stringify(context, null, 2)}`;

  const result = await generateStructured(whatChangedResponseSchema, prompt);

  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }

  const generatedAt = new Date().toISOString();

  const { error } = await supabase.from("ai_insights").insert({
    care_profile_id: careProfileId,
    kind: "what_changed",
    content: { ...result.data, summary: result.data.currentObservation },
    generated_at: generatedAt,
  });
  if (error) console.error("Failed to persist What Changed insight:", error.message);

  return { ok: true, response: result.data, generatedAt };
}
