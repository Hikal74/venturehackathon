import "server-only";

/**
 * Thin wrapper around the Gemini API (@google/genai). Every Aura AI feature
 * goes through `generateStructured`, which:
 *   1. asks Gemini for JSON matching a Zod schema (derived automatically via
 *      `z.toJSONSchema`, so the schema sent to Gemini can never drift from
 *      the one we validate the response against),
 *   2. re-validates the response with that same Zod schema before trusting
 *      it — an LLM that returns malformed JSON is treated as a failure, not
 *      patched or guessed at,
 *   3. never throws past its own boundary — callers get a typed
 *      `{ ok: false, reason }` instead, so a Gemini outage degrades to the
 *      app's honest "Aura AI is temporarily unavailable" state (spec §27)
 *      rather than a 500.
 *
 * `thinkingConfig: { thinkingBudget: 0 }` is set on every call: the current
 * default Gemini model spends a substantial, variable number of tokens on
 * internal "thinking" before producing visible output — confirmed live
 * against this project's own API key, a trivial prompt burned 500+ thinking
 * tokens against a 4096 budget, and a lower budget (matching what this file
 * used to request) truncated the response mid-JSON. Our prompts are
 * constrained extraction/summarization over context we already assembled
 * ourselves, not open-ended reasoning, so thinking buys nothing here and
 * only adds latency, cost, and a truncation risk. Disabling it made
 * responses fast and reliably complete in testing.
 */
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getServerEnv, isAiConfigured } from "@/lib/env";
import { AURA_AI_SYSTEM_INSTRUCTION } from "./guardrails";

export type AiResult<T> = { ok: true; data: T } | { ok: false; reason: string };

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!isAiConfigured()) return null;
  if (!client) {
    const env = getServerEnv();
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return client;
}

function toGeminiJsonSchema(schema: z.ZodType): unknown {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  const { $schema, ...rest } = jsonSchema;
  void $schema;
  return rest;
}

export async function generateStructured<T>(
  schema: z.ZodType<T>,
  prompt: string,
  options?: { temperature?: number }
): Promise<AiResult<T>> {
  const ai = getClient();
  if (!ai) return { ok: false, reason: "Aura AI is not configured (no Gemini API key set)." };

  const env = getServerEnv();

  try {
    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: AURA_AI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: toGeminiJsonSchema(schema),
        temperature: options?.temperature ?? 0.4,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === "MAX_TOKENS") {
      console.error("Aura AI response was truncated (hit maxOutputTokens).");
      return { ok: false, reason: "Aura AI's response was too long and got cut off. Please try again." };
    }

    const text = response.text;
    if (!text) return { ok: false, reason: "Aura AI returned an empty response." };

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      return { ok: false, reason: "Aura AI returned a response that could not be read." };
    }

    const validated = schema.safeParse(parsedJson);
    if (!validated.success) {
      console.error("Aura AI response failed schema validation:", validated.error.message);
      return { ok: false, reason: "Aura AI returned a response in an unexpected format." };
    }

    return { ok: true, data: validated.data };
  } catch (err) {
    console.error("Gemini request failed:", err);
    return { ok: false, reason: "Aura AI is temporarily unavailable. Please try again shortly." };
  }
}

export async function generateText(prompt: string): Promise<AiResult<string>> {
  const ai = getClient();
  if (!ai) return { ok: false, reason: "Aura AI is not configured (no Gemini API key set)." };

  const env = getServerEnv();

  try {
    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: AURA_AI_SYSTEM_INSTRUCTION,
        temperature: 0.5,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const text = response.text;
    if (!text) return { ok: false, reason: "Aura AI returned an empty response." };
    return { ok: true, data: text };
  } catch (err) {
    console.error("Gemini request failed:", err);
    return { ok: false, reason: "Aura AI is temporarily unavailable. Please try again shortly." };
  }
}
