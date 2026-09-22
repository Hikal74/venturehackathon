import { z } from "zod";

/**
 * Structured output contract for the "What Changed?" feature (see
 * docs/AI_SYSTEM.md § Response format, mirroring PROJECT spec section 12).
 * Gemini is asked to fill exactly this shape (via responseJsonSchema, see
 * lib/ai/gemini-client.ts) and the result is re-validated with this same
 * schema before it ever reaches a user — if Gemini's output doesn't parse,
 * the caller treats that the same as an AI failure, never guesses or
 * patches the response.
 *
 * Every field is plain text (not further AI-generated structure) so the
 * model can't invent typed data (fake sensor numbers, fake event IDs) —
 * numbers and IDs the UI shows come only from our own database queries in
 * the context builder, never parsed out of the model's prose.
 */
export const whatChangedResponseSchema = z.object({
  currentObservation: z
    .string()
    .describe("What changed in the signals right now, compared to this person's baseline. Measured/calculated facts only."),
  relevantContext: z
    .string()
    .describe("Recent history relevant to interpreting this change (similar past periods, time of day, etc.)."),
  possibleAssociations: z
    .string()
    .describe(
      "Caregiver observations or patterns that have co-occurred with similar changes before. Must state 'association', never 'cause'. Say so explicitly if there isn't enough data for this section."
    ),
  suggestedResponse: z
    .string()
    .describe("Response prioritizing this profile's own saved support strategies. Say so if none apply or none are saved."),
  whatToWatch: z.string().describe("Which signals or context are worth watching next."),
  confidenceAndLimitations: z
    .string()
    .describe("Honest statement of data limitations — e.g. short history, few similar past events, missing observations."),
});
export type WhatChangedResponse = z.infer<typeof whatChangedResponseSchema>;

export const chatResponseSchema = z.object({
  reply: z.string().describe("The conversational answer to the caregiver's question, grounded only in the supplied context."),
  confidenceAndLimitations: z
    .string()
    .nullable()
    .describe("Only non-null when relevant: note any data gaps that limit how confident this answer can be."),
});
export type ChatResponse = z.infer<typeof chatResponseSchema>;
