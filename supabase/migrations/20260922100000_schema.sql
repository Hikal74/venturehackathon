-- AuraLink Care — core schema
--
-- Design notes (see docs/DATABASE.md for the full write-up):
--   * `profiles` is a 1:1 extension of Supabase's built-in `auth.users`,
--     holding app-level fields (display name, role) that Supabase Auth
--     doesn't store itself. It's created automatically by a trigger
--     (see 20260922100100_functions_triggers.sql) the moment someone signs up.
--   * `care_profiles` is the person being supported (NOT the account holder —
--     a caregiver account can have more than one care profile, e.g. two
--     children). Every clinically/behaviorally relevant table hangs off
--     `care_profile_id`, not off the account, because access to a care
--     profile is what actually needs to be shared/restricted (see
--     `profile_access` and the RLS policies in the third migration).
--   * Timestamps are `timestamptz` throughout — never naive local time —
--     because sensor timing and "time of day" pattern analysis must be
--     unambiguous across timezones.
--   * `on delete cascade` from care_profiles down through every child table
--     means deleting a care profile (or "DELETE MY DATA") removes all of
--     that person's data in one statement, with no orphaned rows.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- profiles: one row per account (auth.users), app-level fields only.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'New user',
  role text not null default 'caregiver' check (role in ('caregiver', 'specialist', 'admin')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'App-level extension of auth.users. One row per account, auto-created on signup.';

-- ---------------------------------------------------------------------------
-- care_profiles: the individual being supported.
-- ---------------------------------------------------------------------------
create table if not exists public.care_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  age_range text check (age_range in ('child_5_9', 'preteen_10_12', 'teen_13_17', 'adult_18_plus')),
  preferred_language text not null default 'en',
  communication_preferences jsonb not null default '{}'::jsonb,
  onboarding_complete boolean not null default false,
  onboarding_step text not null default 'basic_profile',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists care_profiles_owner_id_idx on public.care_profiles (owner_id);

comment on table public.care_profiles is 'The ASD individual being supported. A caregiver account may own several.';
comment on column public.care_profiles.is_demo is 'Marks seeded demo data so the UI can label it honestly as simulated, not a real user''s history.';

-- ---------------------------------------------------------------------------
-- profile_access: sharing a care profile with a specialist (or co-caregiver).
-- ---------------------------------------------------------------------------
create table if not exists public.profile_access (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  grantee_user_id uuid not null references public.profiles (id) on delete cascade,
  permission text not null default 'view' check (permission in ('view', 'edit')),
  created_at timestamptz not null default now(),
  unique (care_profile_id, grantee_user_id)
);

create index if not exists profile_access_grantee_idx on public.profile_access (grantee_user_id);

comment on table public.profile_access is 'Grants a specialist/co-caregiver access to one care profile. Absence of a row = no access.';

-- ---------------------------------------------------------------------------
-- triggers / support_strategies: profile-specific, caregiver-entered.
-- ---------------------------------------------------------------------------
create table if not exists public.triggers (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  label text not null,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists triggers_care_profile_id_idx on public.triggers (care_profile_id);

create table if not exists public.support_strategies (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  label text not null,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists support_strategies_care_profile_id_idx on public.support_strategies (care_profile_id);

comment on table public.triggers is 'Known sensitivities for one care profile. NOT universal medical facts — caregiver-entered preferences.';
comment on table public.support_strategies is 'Known strategies that have helped this specific individual.';

-- ---------------------------------------------------------------------------
-- profile_preferences: routine info from onboarding step 4 (optional, 1:1).
-- ---------------------------------------------------------------------------
create table if not exists public.profile_preferences (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null unique references public.care_profiles (id) on delete cascade,
  routine jsonb not null default '{}'::jsonb,
  notes text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sensor_readings: raw ingested packets (simulator today, real device later).
-- ---------------------------------------------------------------------------
create table if not exists public.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  source text not null default 'simulator' check (source in ('simulator', 'device')),
  heart_rate numeric not null check (heart_rate > 0 and heart_rate < 300),
  hrv numeric check (hrv >= 0),
  gsr numeric check (gsr >= 0),
  skin_temp numeric check (skin_temp > 20 and skin_temp < 45),
  activity_level numeric not null check (activity_level >= 0 and activity_level <= 100),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists sensor_readings_profile_time_idx on public.sensor_readings (care_profile_id, recorded_at desc);

comment on column public.sensor_readings.source is
  'Provenance of this reading. Today only ''simulator'' is produced; a real wearable would POST the same shape with source=''device'' — no schema change needed to go live.';

-- ---------------------------------------------------------------------------
-- baseline_metrics: rolling computed baseline snapshots (prototype algorithm).
-- ---------------------------------------------------------------------------
create table if not exists public.baseline_metrics (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  metric text not null check (metric in ('heart_rate', 'hrv', 'gsr', 'skin_temp', 'activity_level')),
  baseline_mean numeric not null,
  baseline_stddev numeric not null default 0,
  sample_count integer not null default 0,
  window_start timestamptz not null,
  window_end timestamptz not null,
  computed_at timestamptz not null default now()
);

create index if not exists baseline_metrics_profile_metric_idx on public.baseline_metrics (care_profile_id, metric, computed_at desc);

comment on table public.baseline_metrics is
  'Prototype rolling-window baseline (see lib/analytics/baseline-engine.ts). NOT a clinically validated model — explicitly labelled as such in the UI and docs.';

-- ---------------------------------------------------------------------------
-- events: detected deviation episodes.
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  state text not null check (state in ('mild_elevation', 'elevated', 'high_elevation', 'recovering')),
  deviation_score numeric not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  triggering_reading_id uuid references public.sensor_readings (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists events_profile_time_idx on public.events (care_profile_id, started_at desc);

-- ---------------------------------------------------------------------------
-- observations: caregiver-entered context.
-- ---------------------------------------------------------------------------
create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  occurred_at timestamptz not null default now(),
  environment text,
  activity text,
  possible_trigger text,
  support_action text,
  notes text,
  outcome text,
  event_id uuid references public.events (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists observations_profile_time_idx on public.observations (care_profile_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- Aura AI: conversations + messages + persisted insights.
-- ---------------------------------------------------------------------------
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create index if not exists ai_conversations_profile_idx on public.ai_conversations (care_profile_id, created_at desc);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  structured_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  kind text not null check (kind in ('what_changed', 'pattern', 'daily_summary', 'weekly_report')),
  content jsonb not null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ai_insights_profile_kind_idx on public.ai_insights (care_profile_id, kind, generated_at desc);

comment on table public.ai_insights is 'Persisted AI-generated outputs (What Changed, patterns, summaries) so they can be revisited without re-calling Gemini.';

-- ---------------------------------------------------------------------------
-- Reports: materialized daily/weekly snapshots.
-- ---------------------------------------------------------------------------
create table if not exists public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  period_date date not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (care_profile_id, period_date)
);

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (care_profile_id, period_start)
);
