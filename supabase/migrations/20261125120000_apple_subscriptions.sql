-- Potty Up bought as an Apple subscription inside the iPhone app. One row per Apple subscription,
-- linking it to the account that was made for it. Written only by the apple-signin function
-- (service role); no policies, so the app itself can't read or change it. Deleted with the account.
create table if not exists public.apple_subscriptions (
  original_transaction_id text primary key,   -- Apple's ID for the subscription; stays the same across renewals
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null,
  environment text,                           -- 'Production' | 'Sandbox' (TestFlight and App Review use Sandbox)
  expires_at timestamptz not null,            -- paid up until
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists apple_subscriptions_user_id_idx on public.apple_subscriptions (user_id);
alter table public.apple_subscriptions enable row level security;

comment on column public.profiles.plus_source is '''membership'' (Shopify/Loop) | ''gift'' | ''apple'' (in-app subscription)';
