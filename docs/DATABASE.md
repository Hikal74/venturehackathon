# Database

AuraLink Care uses Supabase Postgres. The schema lives in
`supabase/migrations/` as three files, applied in order:

1. `20260922100000_schema.sql` — tables, constraints, indexes
2. `20260922100100_functions_triggers.sql` — auto-provisioning + `updated_at`
3. `20260922100200_rls.sql` — Row Level Security policies

`src/types/database.ts` is a hand-written mirror of this schema (see its
docstring — normally this file is generated with `supabase gen types
typescript`, but there's no live Supabase project to generate from until
you create one).

## Entity overview

```
auth.users (Supabase-managed)
  └─ profiles                 1:1, app-level fields (display name, role)
       └─ care_profiles       1:many — the individual(s) being supported
            ├─ profile_access         sharing with a specialist/co-caregiver
            ├─ triggers                known sensitivities (caregiver-entered)
            ├─ support_strategies      known strategies (caregiver-entered)
            ├─ profile_preferences     routine info (1:1, optional)
            ├─ sensor_readings         raw ingested packets
            ├─ baseline_metrics        computed baseline snapshots
            ├─ events                  detected deviation episodes
            ├─ observations            caregiver-entered context
            ├─ ai_conversations
            │    └─ ai_messages
            ├─ ai_insights             persisted What Changed / pattern output
            ├─ daily_summaries
            └─ weekly_reports
```

Every table below `care_profiles` carries a `care_profile_id` foreign key
with `on delete cascade` — deleting a care profile (the "Delete My Data"
button) removes everything under it in one statement, with no orphaned rows.

## Why `care_profiles` is separate from `profiles`

`profiles` is the account (one per login). `care_profiles` is the person
being supported. They're different rows on purpose:

- One caregiver account can support more than one person (e.g. two
  children) — each gets its own `care_profiles` row, its own baseline, its
  own everything.
- Access is granted per care profile (`profile_access`), not per account —
  a specialist might be able to see one child's profile but not their
  sibling's, even if both are owned by the same caregiver account.

## Key design choices

**`sensor_readings.source`** is `'simulator' | 'device'`. Nothing else about
the row differs. This is what makes "a real wearable could replace the
simulator without an app rewrite" literally true: point a device at
`POST /api/device/readings` with `source: 'device'` and it lands in the
exact same table, read by the exact same analysis code.

**`events`** are not one row per sensor reading — they're episodes. An
episode opens when signals first cross into elevation, its `state` and
`deviation_score` get updated while it continues (score only ever
increases, so it reflects the episode's peak), and it closes
(`ended_at` set) once signals return fully to baseline. See
`docs/AI_SYSTEM.md` for the state machine.

**`baseline_metrics`** is a historical record, not the live source of
truth. The dashboard's "how is this person doing right now" always
recomputes fresh from `sensor_readings` on every load (see
`lib/analytics/analysis-engine.ts`) — `baseline_metrics` rows are written
alongside each computation so there's an auditable timestamped snapshot,
but nothing reads them back for the live status.

**`ai_insights.content`** and `daily_summaries`/`weekly_reports.content`
are `jsonb`. This is the one deliberate schema-less pocket in an otherwise
fully-typed schema — AI output shape and report shape are both defined and
validated in TypeScript (Zod schemas in `lib/ai/response-schema.ts` and the
`ReportContent` interface in `services/reports.ts`), so `jsonb` here is a
storage convenience, not a way to skip validation.

## Row Level Security

Every table from `care_profiles` down is gated by two SQL functions:

```sql
has_care_profile_access(id)       -- true for the owner OR anyone granted
                                   -- view/edit via profile_access
has_care_profile_edit_access(id)  -- true for the owner OR anyone granted
                                   -- edit specifically
```

Both are `security definer` functions — necessary so a policy on, say,
`sensor_readings` can check `care_profiles`/`profile_access` without
recursively re-triggering RLS on those tables. The function body is the
only place access is decided; every table policy just calls it.

**This is enforced by Postgres, not by application code remembering to
filter a query.** If a route handler forgot to scope a query by
`care_profile_id`, the query would still only return rows the
authenticated user is allowed to see — RLS is the actual boundary, the
application-level scoping is a second layer on top of it. See
`docs/SECURITY.md` for how this is tested.

## The service-role (admin) client

`src/lib/supabase/admin.ts` exists and is wired to `SUPABASE_SERVICE_ROLE_KEY`,
but **as of this MVP nothing calls it** — device ingestion and every other
write goes through the caller's own RLS-scoped session (see
`src/app/api/device/readings/route.ts`). It's kept in the codebase for the
documented future case where an operation genuinely has no user session to
scope by (e.g. a real wearable authenticating with a per-device credential
instead of a caregiver's login) — see `docs/ARCHITECTURE.md`
"What's simulated vs. real" for that path. Every function that will
eventually use it must manually verify the `care_profile_id` it's touching
before this client is invoked — it bypasses RLS entirely by design.

## Regenerating types

Once you have a real Supabase project linked:

```bash
supabase gen types typescript --linked > src/types/database.ts
```

Do this any time the migrations change — `src/types/database.ts` has no
mechanism to detect drift on its own.
