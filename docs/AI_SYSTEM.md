# AI System

Two things live in this document: the **Personal Baseline Engine**
(deterministic, no AI) and **Aura AI** (Gemini-backed). The dashboard,
Patterns, and Reports depend only on the first. Aura AI depends on the
first as an input.

## Personal Baseline Engine — prototype logic, not a clinical model

Implementation: `src/lib/analytics/baseline-engine.ts` (pure functions, unit
tested in the adjacent `.test.ts`) + `src/lib/analytics/analysis-engine.ts`
(wires it to the database).

**The idea.** Compare each person only against their own recent history,
never a population threshold. For each metric (heart rate, HRV, GSR, skin
temperature, activity), compute a rolling mean and standard deviation from
that person's own `sensor_readings` over a trailing 7-day window (excluding
the most recent 20 minutes, so a current spike can't dilute its own
baseline, and excluding any reading that falls inside an already-detected
`events` window, so repeated real elevation doesn't quietly get absorbed
into "normal" over time).

**Deviation score.** Each metric's current value becomes a z-score against
its own baseline: `(value - mean) / stddev`. These are combined into one
`baselineDeviationScore` with hand-picked, documented weights:

```
heart_rate:      +0.3
gsr:             +0.3
hrv:             -0.2   (inverted — LOWER HRV is associated with higher arousal)
skin_temp:       +0.1
activity_level:  +0.1
```

Weights are renormalized over whichever metrics actually have both a
current value and a valid baseline (at least 12 samples in the window), so
a missing sensor doesn't silently zero out the score.

**State classification.** The combined score is bucketed:

| `|score|` | State |
|---|---|
| < 0.5 | Calm |
| 0.5 – 1.0 | Mild Elevation |
| 1.0 – 1.75 | Elevated |
| ≥ 1.75 | High Elevation |

"Recovering" isn't a score bucket — it's assigned when there's a currently
open `events` row and the score has fallen to below 75% of that episode's
recorded peak but hasn't yet returned to the Calm bucket. "Insufficient
Data" is returned whenever zero metrics had a usable baseline (e.g. a
brand-new profile with no seeded data and fewer than ~12 readings sent).

**Why this is honestly labeled a prototype.** The weights, thresholds, and
even the choice of z-score combination are a reasonable, documented
starting point — not derived from a clinical study, not validated against
any ground truth. The code is intentionally modular (`baseline-engine.ts`
takes numbers in, returns numbers out, with zero database or AI
dependency) specifically so a real trained model could replace
`computeOverallDeviationScore`/`classifyState` without touching anything
that calls it.

## Aura AI

Aura AI is **not a generic chatbot** — every call is grounded in a context
object built specifically for one care profile.

```
User question / "What Changed?" press
  → authenticate request (Supabase session)
  → resolve the active care profile
  → Context Builder (lib/ai/context-builder.ts)
  → Gemini (lib/ai/gemini-client.ts), structured JSON output
  → validate response against the same Zod schema sent to Gemini
  → persist (ai_insights or ai_conversations/ai_messages)
  → return to caregiver
```

### The Context Builder

`lib/ai/context-builder.ts` gathers, for one `care_profile_id`:

- profile info, communication preferences
- known sensitivities and support strategies (caregiver-entered)
- current status: latest reading, per-metric baseline deviation
- up to 8 recent events, 8 recent observations
- Pattern Discovery's output (same engine the Patterns page uses)
- up to 3 recent past Aura AI insights

This is a bounded, curated object — not "dump the database." Anyone can
read this one file and see exactly what Gemini is allowed to know for a
given request. Every query inside it uses the caller's own RLS-scoped
Supabase client, so it's structurally impossible for this function to pull
another care profile's data even by mistake.

### Guardrails

`lib/ai/guardrails.ts` is the system instruction sent with every call. It
hard-codes the rules that make this a *responsible* assistive tool instead
of a liability:

1. Never diagnose a medical condition.
2. Never claim certainty about an emotion — "signals are elevated relative
   to baseline," never "they are anxious."
3. Never claim correlation is causation, even if the caregiver's own notes
   use causal language.
4. Never invent data. If it isn't in the supplied context, say so.
5. Never present itself as a replacement for professional care.
6. Distinguish, in wording: **Measured** (a raw reading), **Calculated** (a
   baseline/deviation), **Observed** (caregiver-logged), **Inferred** (a
   pattern/association — always flagged as such). This distinction is also
   surfaced directly in the UI via the small colored evidence tags next to
   every AI-derived statement.
7. Be honest when context is thin — "there isn't enough history yet" is a
   complete, acceptable answer.
8. Prioritize this profile's own saved support strategies over generic
   advice.

### Structured response format ("What Changed?")

Requested from Gemini via `responseJsonSchema` (derived automatically from
the Zod schema in `lib/ai/response-schema.ts` via `z.toJSONSchema`, so the
schema sent to Gemini and the schema used to validate its reply can never
drift from each other) and re-validated on return — a malformed response
is treated as an AI failure, never patched or guessed at.

| Section | Evidence kind shown in UI |
|---|---|
| Current observation | Calculated |
| Relevant context | Observed |
| Possible associations | Inferred |
| Suggested response | Inferred (prioritizes saved strategies) |
| What to watch | Inferred |
| Confidence & limitations | — (always shown) |

### Chat

`services/ai-chat.ts` persists every user/assistant turn to
`ai_conversations`/`ai_messages`, and rebuilds the full context object on
**every** turn — Gemini itself is stateless between calls, so the
"profile-aware" property only holds if the context is resent each time,
not just on the first message.

### Failure handling

`generateStructured`/`generateText` never throw past their own boundary —
a Gemini error, timeout, or missing API key all return a typed
`{ ok: false, reason }`. Both API routes (`/api/ai/what-changed`,
`/api/ai/chat`) turn that into a `503` with a plain-language message; the
UI shows it as "Aura AI is temporarily unavailable," never a fake or
cached-looking answer.
