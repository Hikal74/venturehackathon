-- AuraLink Care — functions & triggers
--
-- 1. handle_new_user(): auto-creates a `public.profiles` row the instant
--    someone signs up via Supabase Auth. Without this, a fresh signup would
--    have an `auth.users` row but no app-level profile, and every query that
--    joins against `profiles` (which is most of them) would break.
--
-- 2. set_updated_at(): a tiny reusable trigger to keep `updated_at` honest
--    without relying on every UPDATE statement in the app to remember to set
--    it.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'caregiver'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists care_profiles_set_updated_at on public.care_profiles;
create trigger care_profiles_set_updated_at
  before update on public.care_profiles
  for each row execute function public.set_updated_at();
