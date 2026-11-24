-- Text the AI coach reads at runtime (the UpAiry Potty Playbook). Server-only.
create table if not exists public.coach_content (
  id text primary key,
  body text not null,
  updated_at timestamptz not null default now()
);
alter table public.coach_content enable row level security;

-- The coach's daily question limit resets at the parent's own midnight, and failed answers are refunded.
drop function if exists public.bump_coach_usage(uuid);
create or replace function public.coach_local_day(p_tz text)
returns date language plpgsql stable set search_path = '' as $$
begin
  if p_tz is not null and exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz) then
    return (now() at time zone p_tz)::date;
  end if;
  return (now() at time zone 'UTC')::date;
end $$;
create or replace function public.bump_coach_usage(p_user uuid, p_tz text default 'UTC')
returns integer language sql security definer set search_path = '' as $$
  insert into public.coach_usage (user_id, day, questions) values (p_user, public.coach_local_day(p_tz), 1)
  on conflict (user_id, day) do update set questions = public.coach_usage.questions + 1
  returning questions;
$$;
create or replace function public.refund_coach_usage(p_user uuid, p_tz text default 'UTC')
returns void language sql security definer set search_path = '' as $$
  update public.coach_usage set questions = greatest(questions - 1, 0)
  where user_id = p_user and day = public.coach_local_day(p_tz);
$$;
revoke all on function public.bump_coach_usage(uuid, text) from public, anon, authenticated;
revoke all on function public.refund_coach_usage(uuid, text) from public, anon, authenticated;
revoke all on function public.coach_local_day(text) from public, anon, authenticated;
grant execute on function public.bump_coach_usage(uuid, text) to service_role;
grant execute on function public.refund_coach_usage(uuid, text) to service_role;
grant execute on function public.coach_local_day(text) to service_role;
