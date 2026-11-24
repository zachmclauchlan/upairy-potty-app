-- People given Potty Up by hand (team, testers, gifts). They sign in with their email and this access number
-- instead of an order number. Nothing is created in Shopify or Loop, so no emails are ever sent. Server-only.
create table if not exists public.manual_access (
  email text primary key,
  access_code text not null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.manual_access enable row level security;
