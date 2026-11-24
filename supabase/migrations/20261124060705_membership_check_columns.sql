-- Membership comes from Shopify (Loop subscription, marked by a customer tag).
alter table public.profiles
  add column plan_checked_at timestamptz,          -- last time we asked Shopify
  add column has_ordered boolean not null default false;
comment on column public.profiles.plus_source is '''membership'' (Shopify/Loop tag) | ''gift''';
