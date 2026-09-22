# Security

## Account isolation

The central guarantee — "User A must never retrieve User B's data" — is
enforced by Postgres Row Level Security, not application code. See
`docs/DATABASE.md` "Row Level Security" for the policy design.

**How to actually verify this**, not just take it on faith: create two
accounts, each with their own care profile and some sensor data. Log in as
account B and try to fetch account A's `care_profile_id` on any page or API
route (e.g. `GET /api/export?careProfileId=<A's id>` while logged in as B).
Every query in that path runs through B's session-scoped Supabase client,
so RLS returns zero rows — the route's own code never gets a chance to leak
anything, because there's nothing to leak by the time it runs the query.

## Secrets

| Secret | Where it lives | Exposure |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Server env only | Never imported by a `"use client"` file — enforced at build time by `import "server-only"` in `lib/supabase/admin.ts` (see `docs/ARCHITECTURE.md`) |
| `GEMINI_API_KEY` | Server env only | Same `server-only` guard, via `lib/env.ts` and `lib/ai/gemini-client.ts`; Gemini is only ever called from an API route |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Intentionally public — the anon key has no privileges beyond what RLS grants |

No API key is hardcoded anywhere in source. `.env.local` is git-ignored
(`.gitignore`); `.env.local.example` documents the required variables
without real values.

## Authentication

Supabase Auth issues short-lived access tokens stored in cookies.
`src/proxy.ts` (Next.js 16's renamed `middleware.ts`) runs on every request,
calls `getUser()` (which transparently refreshes an expiring token), and
writes the refreshed cookie back — without this, sessions would randomly
expire mid-use whenever a Server Component tried to read (but couldn't
write) a refreshed cookie. The proxy also redirects anonymous requests away
from the authenticated app section to `/login`.

## Input validation

Every write that crosses a trust boundary — API route body, Server Action
`FormData` — is validated with a Zod schema before it touches the database
(`src/lib/validation/*.ts`). Sensor packet ranges (heart rate, GSR, etc.)
are validated twice: once in Zod (`lib/validation/sensor.ts`) and again by
Postgres `CHECK` constraints on `sensor_readings` — the second is the real
backstop if application validation is ever bypassed or has a bug.

## What's NOT hardened yet (honest, for judges who ask)

- **CSRF on API routes.** Server Actions get Next.js's built-in
  origin-check CSRF protection automatically. The plain API routes
  (`/api/device/readings`, `/api/ai/*`, `/api/export`) rely on cookie-based
  session auth without an explicit CSRF token; the practical mitigation
  today is that Supabase's session cookies are `SameSite=Lax` by default
  (Next.js's cookie default), which blocks the cookie from being sent on a
  cross-site POST. A production hardening pass would add explicit
  origin/CSRF-token checks to these routes rather than relying on cookie
  defaults alone.
- **No rate limiting** on the Aura AI endpoints. A logged-in user could
  spam `/api/ai/chat` and exhaust the Gemini quota. Fine for a hackathon
  demo; a real deployment would add per-user rate limiting.
- **No audit log** of who viewed/exported/deleted a care profile's data —
  useful for a real caregiving product, out of scope for this MVP.
- **Specialist role has no dedicated UI** enforcing "view only" at the
  interaction level — the `profile_access.permission` column and its RLS
  policies do enforce view-vs-edit at the database level today, but the
  caregiver-facing UI doesn't yet have a separate read-only mode.

## Responsible AI as a security property

Treating "never invent sensor readings or events" and "never diagnose" as
security requirements, not just UX polish: `lib/ai/guardrails.ts` and the
Zod-validated structured output (`lib/ai/response-schema.ts`) are the
enforcement mechanism, detailed in `docs/AI_SYSTEM.md`. A model that
fabricates a plausible-sounding but false clinical claim is a safety
failure, and this system is designed so that failure mode requires the
model to violate an explicit instruction AND produce data that isn't in a
database-sourced context object — not just to "try harder to be honest."
