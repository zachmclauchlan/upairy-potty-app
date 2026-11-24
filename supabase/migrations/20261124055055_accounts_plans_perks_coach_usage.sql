-- UpAiry Potty: account-level data only. Child logs never leave the phone.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'plus')),
  plus_source text,                -- 'order' | 'subscription' | 'gift'
  plus_until timestamptz,          -- null = no expiry
  order_name text,                 -- linked Shopify order, e.g. #1234
  shopify_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per parent account. Plan and linked order only; no child data.';

create table public.perk_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  perk text not null,              -- 'pants_5pack' | 'bed_mat'
  code text,                       -- one-time Shopify discount code
  claimed_at timestamptz not null default now(),
  unique (user_id, perk)
);

create table public.coach_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  questions int not null default 0,
  primary key (user_id, day)
);

-- Row level security: parents can read only their own rows. All writes happen in
-- server functions using the service role, so there are no client write policies.
alter table public.profiles enable row level security;
alter table public.perk_claims enable row level security;
alter table public.coach_usage enable row level security;

create policy "Parents read their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Parents read their own perk claims" on public.perk_claims
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Parents read their own coach usage" on public.coach_usage
  for select to authenticated using ((select auth.uid()) = user_id);

create index perk_claims_user_id_idx on public.perk_claims (user_id);

-- Create a profile automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Count a coach question and return today's total, atomically.
create function public.bump_coach_usage(p_user uuid)
returns int
language sql
security definer
set search_path = ''
as $$
  insert into public.coach_usage (user_id, day, questions) values (p_user, current_date, 1)
  on conflict (user_id, day) do update set questions = public.coach_usage.questions + 1
  returning questions;
$$;
revoke execute on function public.bump_coach_usage(uuid) from public, anon, authenticated;
