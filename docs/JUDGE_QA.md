# Judge Q&A

Honest answers to the hard questions. Where something is a limitation, it's
stated as one — see `docs/ARCHITECTURE.md` "What's simulated vs. real" for
the full breakdown.

---

**Why Supabase?**
It's Postgres (a real relational database, not a toy), with Row Level
Security built in and directly wired to its own Auth (`auth.uid()` inside a
policy), and Auth + Database + a free tier in one product a judge can spin
up in minutes to verify everything themselves. We considered a
custom-rolled auth + separate DB, but that would mean writing our own
session/cookie handling and our own authorization layer under time
pressure — more surface area for exactly the kind of bug ("user A sees user
B's data") this product can least afford.

**How does the AI know about the individual user?**
It doesn't, by default — Gemini is stateless. Every request goes through a
Context Builder (`lib/ai/context-builder.ts`) that queries this specific
care profile's baseline, recent readings, events, observations, known
strategies, and detected patterns, and sends that as structured JSON
alongside the question. See `docs/AI_SYSTEM.md`.

**Where is data stored?**
Postgres, hosted by Supabase. Sensor readings, events, observations,
baselines, AI conversations/insights, and reports are all real rows in real
tables (see `docs/DATABASE.md`) — nothing is kept only in React state or
`localStorage`.

**How do you prevent one caregiver from seeing another's data?**
Row Level Security policies on every table, keyed off `auth.uid()` via two
SQL functions (`has_care_profile_access`/`has_care_profile_edit_access`).
This is enforced by Postgres itself, not by application code remembering
to add a `WHERE` clause — see `docs/SECURITY.md` for how to verify it
directly.

**What happens if Gemini stops working?**
`lib/ai/gemini-client.ts` catches every failure mode (missing key, network
error, malformed response) and returns a typed failure instead of throwing
or faking a response. Aura AI (chat, What Changed) shows "temporarily
unavailable." Dashboard, Timeline, Patterns, and Reports don't call Gemini
at all and are unaffected — see `docs/ARCHITECTURE.md` "AI failure
fallback." This is easy to demonstrate live: unset `GEMINI_API_KEY` and
reload.

**How does the wearable communicate with the software?**
There is no physical wearable yet (see below). The Device Simulator sends
an HTTP `POST` to `/api/device/readings` with the same JSON shape a real
device's gateway would send — heart rate, HRV, GSR, skin temperature,
activity level. That's a deliberate contract: pointing a real device at
that URL requires no application changes beyond adding a device-specific
authentication method (see `docs/SECURITY.md` and the route's own
docstring for exactly what would need to change).

**Is your AI actually diagnosing stress/anxiety/autism?**
No, by explicit design at three layers: (1) the system instruction
(`lib/ai/guardrails.ts`) forbids it outright, (2) the structured response
schema shapes output into observation/context/association/suggestion
sections rather than a free-form diagnosis, (3) the UI's evidence tags
(Measured/Calculated/Observed/Inferred) make the distinction visible, not
just implied in wording. Try asking Aura AI directly whether someone is
anxious — it's instructed to decline and explain why.

**How does Pattern Discovery work?**
Plain arithmetic over stored `events` and `observations` — no AI call
(`lib/patterns/pattern-engine.ts`). It buckets events by time-of-day and
counts how many distinct days they recurred on, groups observations by
their `possible_trigger`/`activity` text and counts co-occurrence with
elevated events, and compares average recovery duration across different
logged support strategies. Every finding requires a minimum sample size
before it's shown, and every description is phrased as an association
("X frequently appears alongside...") never a cause.

**Why is this more than an LLM wrapper?**
Delete `GEMINI_API_KEY` from the environment and the app still: computes a
live personalized status, shows baseline comparisons, ingests and persists
sensor data, opens/closes deviation episodes, finds patterns, and generates
full daily/weekly reports. The AI layer sits on top of a deterministic
analytics engine and only adds a natural-language explanation of what that
engine already computed — it doesn't compute the underlying facts.

**What part did your team actually build?**
Everything in this repository: schema and RLS policies, auth flow,
onboarding, the baseline/deviation algorithm, event lifecycle, ingestion
endpoint, simulator, timeline, pattern engine, the Aura AI context builder
and guardrails, reports, and the UI. The only third-party intelligence
involved is calling Gemini's API for natural-language generation over data
we've already computed ourselves.

**What parts are currently simulated?**
The wearable hardware itself (see the Device Simulator) and its
authentication method (currently the caregiver's own login session; a real
device would need its own credential — see `docs/SECURITY.md`). Demo data
seeded during onboarding is clearly labeled and deterministic (same
scenario every time), not fabricated in a way that pretends to be a real
user's history — see `services/demo-seed.ts`'s docstring for exactly what
is and isn't replayed through the real analysis engine.

**What would you need before real-world (medical-adjacent) deployment?**
At minimum: clinical input on the baseline algorithm and thresholds (today
explicitly a documented starting point, not validated), a real
device-authentication scheme for physical hardware, rate limiting and an
audit log, a specialist-specific UI (the data model already supports
view/edit sharing per profile), a data retention/consent policy review,
and likely a formal accessibility audit given the target users. None of
that is pretended to exist today.
