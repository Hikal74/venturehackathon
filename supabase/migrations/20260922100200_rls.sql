-- AuraLink Care — Row Level Security
--
-- This is the file that actually enforces "User A must never retrieve
-- User B's data" — it's not just an application-layer convention, it's a
-- Postgres-level guarantee that holds even if a bug in our Next.js code
-- forgot to filter a query by user.
--
-- Pattern used everywhere below:
--   * `has_care_profile_access(id)`      -> true for the owner OR anyone
--                                            granted view/edit access via
--                                            profile_access. Used for SELECT.
--   * `has_care_profile_edit_access(id)` -> true for the owner OR anyone
--                                            granted *edit* access. Used for
--                                            INSERT/UPDATE/DELETE.
--
-- Both are SECURITY DEFINER functions. That's required (not just a style
-- choice): a policy on table B that queries table A would otherwise be
-- re-evaluated under RLS on table A too, which either recurses or silently
-- hides rows the caller *should* be allowed to see. SECURITY DEFINER lets
-- the function read care_profiles/profile_access directly, while the
-- function body itself is the only place that decides who gets access.

create or replace function public.has_care_profile_access(target_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.care_profiles cp
    where cp.id = target_profile_id and cp.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.profile_access pa
    where pa.care_profile_id = target_profile_id and pa.grantee_user_id = auth.uid()
  );
$$;

create or replace function public.has_care_profile_edit_access(target_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.care_profiles cp
    where cp.id = target_profile_id and cp.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.profile_access pa
    where pa.care_profile_id = target_profile_id
      and pa.grantee_user_id = auth.uid()
      and pa.permission = 'edit'
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Insert happens only via the handle_new_user() trigger (security definer),
-- so no client-facing insert policy is needed or granted.

-- ---------------------------------------------------------------------------
-- care_profiles
-- ---------------------------------------------------------------------------
alter table public.care_profiles enable row level security;

create policy "care_profiles_select" on public.care_profiles
  for select using (owner_id = auth.uid() or public.has_care_profile_access(id));

create policy "care_profiles_insert_own" on public.care_profiles
  for insert with check (owner_id = auth.uid());

create policy "care_profiles_update" on public.care_profiles
  for update using (owner_id = auth.uid() or public.has_care_profile_edit_access(id));

create policy "care_profiles_delete_own" on public.care_profiles
  for delete using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- profile_access — only the owning caregiver manages sharing.
-- ---------------------------------------------------------------------------
alter table public.profile_access enable row level security;

create policy "profile_access_select" on public.profile_access
  for select using (
    grantee_user_id = auth.uid()
    or exists (select 1 from public.care_profiles cp where cp.id = care_profile_id and cp.owner_id = auth.uid())
  );

create policy "profile_access_manage" on public.profile_access
  for all using (
    exists (select 1 from public.care_profiles cp where cp.id = care_profile_id and cp.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.care_profiles cp where cp.id = care_profile_id and cp.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Generic per-care-profile tables: same four policies, parameterized by
-- table name. Written out explicitly (Postgres has no policy templates) but
-- the shape is identical for every table below.
-- ---------------------------------------------------------------------------

-- triggers
alter table public.triggers enable row level security;
create policy "triggers_select" on public.triggers for select using (public.has_care_profile_access(care_profile_id));
create policy "triggers_write" on public.triggers for all
  using (public.has_care_profile_edit_access(care_profile_id))
  with check (public.has_care_profile_edit_access(care_profile_id));

-- support_strategies
alter table public.support_strategies enable row level security;
create policy "support_strategies_select" on public.support_strategies for select using (public.has_care_profile_access(care_profile_id));
create policy "support_strategies_write" on public.support_strategies for all
  using (public.has_care_profile_edit_access(care_profile_id))
  with check (public.has_care_profile_edit_access(care_profile_id));

-- profile_preferences
alter table public.profile_preferences enable row level security;
create policy "profile_preferences_select" on public.profile_preferences for select using (public.has_care_profile_access(care_profile_id));
create policy "profile_preferences_write" on public.profile_preferences for all
  using (public.has_care_profile_edit_access(care_profile_id))
  with check (public.has_care_profile_edit_access(care_profile_id));

-- sensor_readings
alter table public.sensor_readings enable row level security;
create policy "sensor_readings_select" on public.sensor_readings for select using (public.has_care_profile_access(care_profile_id));
create policy "sensor_readings_write" on public.sensor_readings for all
  using (public.has_care_profile_edit_access(care_profile_id))
  with check (public.has_care_profile_edit_access(care_profile_id));

-- baseline_metrics (system-computed; caregivers read, writes come from the analytics engine using the user's own session)
alter table public.baseline_metrics enable row level security;
create policy "baseline_metrics_select" on public.baseline_metrics for select using (public.has_care_profile_access(care_profile_id));
create policy "baseline_metrics_write" on public.baseline_metrics for all
  using (public.has_care_profile_edit_access(care_profile_id))
  with check (public.has_care_profile_edit_access(care_profile_id));

-- events
alter table public.events enable row level security;
create policy "events_select" on public.events for select using (public.has_care_profile_access(care_profile_id));
create policy "events_write" on public.events for all
  using (public.has_care_profile_edit_access(care_profile_id))
  with check (public.has_care_profile_edit_access(care_profile_id));

-- observations
alter table public.observations enable row level security;
create policy "observations_select" on public.observations for select using (public.has_care_profile_access(care_profile_id));
create policy "observations_write" on public.observations for all
  using (public.has_care_profile_edit_access(care_profile_id))
  with check (public.has_care_profile_edit_access(care_profile_id));

-- ai_conversations
alter table public.ai_conversations enable row level security;
create policy "ai_conversations_select" on public.ai_conversations for select using (public.has_care_profile_access(care_profile_id));
create policy "ai_conversations_write" on public.ai_conversations for all
  using (public.has_care_profile_edit_access(care_profile_id))
  with check (public.has_care_profile_edit_access(care_profile_id));

-- ai_messages (scoped via the parent conversation's care_profile_id)
alter table public.ai_messages enable row level security;
create policy "ai_messages_select" on public.ai_messages for select using (
  exists (
    select 1 from public.ai_conversations c
    where c.id = conversation_id and public.has_care_profile_access(c.care_profile_id)
  )
);
create policy "ai_messages_write" on public.ai_messages for all using (
  exists (
    select 1 from public.ai_conversations c
    where c.id = conversation_id and public.has_care_profile_edit_access(c.care_profile_id)
  )
) with check (
  exists (
    select 1 from public.ai_conversations c
    where c.id = conversation_id and public.has_care_profile_edit_access(c.care_profile_id)
  )
);

-- ai_insights
alter table public.ai_insights enable row level security;
create policy "ai_insights_select" on public.ai_insights for select using (public.has_care_profile_access(care_profile_id));
create policy "ai_insights_write" on public.ai_insights for all
  using (public.has_care_profile_edit_access(care_profile_id))
  with check (public.has_care_profile_edit_access(care_profile_id));

-- daily_summaries
alter table public.daily_summaries enable row level security;
create policy "daily_summaries_select" on public.daily_summaries for select using (public.has_care_profile_access(care_profile_id));
create policy "daily_summaries_write" on public.daily_summaries for all
  using (public.has_care_profile_edit_access(care_profile_id))
  with check (public.has_care_profile_edit_access(care_profile_id));

-- weekly_reports
alter table public.weekly_reports enable row level security;
create policy "weekly_reports_select" on public.weekly_reports for select using (public.has_care_profile_access(care_profile_id));
create policy "weekly_reports_write" on public.weekly_reports for all
  using (public.has_care_profile_edit_access(care_profile_id))
  with check (public.has_care_profile_edit_access(care_profile_id));
