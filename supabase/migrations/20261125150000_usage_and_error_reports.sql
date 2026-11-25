-- Usage numbers and error reports, kept on our own database (no outside tracker).
-- Account-level only: when a parent finished setup, when they last opened the app, and on which days.
-- Nothing about the child, no logs, no screen-by-screen tracking.

alter table public.profiles
  add column if not exists onboarded_at timestamptz,     -- finished the setup quiz
  add column if not exists last_active_at timestamptz,   -- last time the app was opened while signed in
  add column if not exists platform text,                -- 'ios' | 'android' | 'web'
  add column if not exists app_version text;

-- One row per account per day it opened the app, so we can see who comes back.
create table if not exists public.activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);
create index if not exists activity_days_day_idx on public.activity_days (day);
alter table public.activity_days enable row level security;

-- The app calls this when it opens (at most every few hours) and when setup is finished.
create or replace function public.touch_activity(p_onboarded boolean default false, p_platform text default null, p_version text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return; end if;
  update public.profiles set
    last_active_at = now(),
    platform = coalesce(left(p_platform, 20), platform),
    app_version = coalesce(left(p_version, 40), app_version),
    onboarded_at = case when p_onboarded and onboarded_at is null then now() else onboarded_at end
  where id = auth.uid();
  insert into public.activity_days (user_id, day) values (auth.uid(), (now() at time zone 'utc')::date)
  on conflict do nothing;
end $$;
revoke all on function public.touch_activity(boolean, text, text) from public, anon;
grant execute on function public.touch_activity(boolean, text, text) to authenticated;

-- Errors the app ran into (a screen crashed, or something failed unexpectedly). Server-only to read.
create table if not exists public.error_reports (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid,                 -- null when it happened before sign-in
  fatal boolean not null default false,   -- true = the parent saw the "Something went wrong" screen
  message text not null,
  stack text,
  place text,                   -- which part of the app reported it
  platform text,
  app_version text
);
create index if not exists error_reports_at_idx on public.error_reports (at desc);
alter table public.error_reports enable row level security;

-- Anyone running the app can report an error, signed in or not. Text is cut to size, and reports stop
-- at 300 an hour so a broken build (or someone hammering the endpoint) can't fill the table.
create or replace function public.report_error(p_message text, p_stack text default null, p_place text default null, p_platform text default null, p_version text default null, p_fatal boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(p_message, '') = '' then return; end if;
  if (select count(*) from public.error_reports where at > now() - interval '1 hour') >= 300 then return; end if;
  insert into public.error_reports (user_id, fatal, message, stack, place, platform, app_version)
  values (auth.uid(), coalesce(p_fatal, false), left(p_message, 500), left(p_stack, 4000), left(p_place, 80), left(p_platform, 20), left(p_version, 40));
end $$;
revoke all on function public.report_error(text, text, text, text, text, boolean) from public;
grant execute on function public.report_error(text, text, text, text, text, boolean) to anon, authenticated;

-- The numbers, ready to read in the Supabase dashboard (Table Editor). security_invoker keeps them
-- invisible to the app: only the dashboard and server functions can see across accounts.
create or replace view public.usage_summary with (security_invoker = true) as
select
  count(*)                                                                    as accounts,
  count(*) filter (where plan = 'plus')                                       as unlocked_now,
  count(*) filter (where onboarded_at is not null)                            as finished_setup,
  round(100.0 * count(*) filter (where onboarded_at is not null) / nullif(count(*), 0)) as finished_setup_pct,
  count(*) filter (where last_active_at > now() - interval '1 day')           as active_last_24h,
  count(*) filter (where last_active_at > now() - interval '7 days')          as active_last_7_days,
  count(*) filter (where last_active_at > now() - interval '30 days')         as active_last_30_days,
  count(*) filter (where created_at > now() - interval '7 days')              as new_last_7_days
from public.profiles;

create or replace view public.usage_by_day with (security_invoker = true) as
select d.day::date as day,
  (select count(*) from public.profiles p where p.created_at::date = d.day::date)   as new_accounts,
  (select count(*) from public.profiles p where p.onboarded_at::date = d.day::date) as finished_setup,
  (select count(*) from public.activity_days a where a.day = d.day::date)           as active_accounts,
  (select count(*) from public.error_reports e where e.at::date = d.day::date)      as errors
from generate_series(current_date - 59, current_date, interval '1 day') as d(day)
order by 1 desc;

-- Of the accounts created each day, what share opened the app again 1, 3 and 7 days later.
create or replace view public.usage_retention with (security_invoker = true) as
select p.created_at::date as signed_up, count(*) as accounts,
  round(100.0 * count(*) filter (where exists (select 1 from public.activity_days a where a.user_id = p.id and a.day = p.created_at::date + 1)) / count(*)) as back_day_1_pct,
  round(100.0 * count(*) filter (where exists (select 1 from public.activity_days a where a.user_id = p.id and a.day = p.created_at::date + 3)) / count(*)) as back_day_3_pct,
  round(100.0 * count(*) filter (where exists (select 1 from public.activity_days a where a.user_id = p.id and a.day = p.created_at::date + 7)) / count(*)) as back_day_7_pct
from public.profiles p
group by 1 order by 1 desc;
