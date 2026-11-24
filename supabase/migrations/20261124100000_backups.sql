-- Cloud backup of a family's app data (logs, check-ins, program, rewards, coach chat), so it follows the
-- parent's account to a new phone. One row per account. Only the account owner can read or write it.
-- Deleted automatically when the account is deleted.
create table if not exists public.backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint backups_size check (octet_length(data::text) < 5000000)
);
alter table public.backups enable row level security;
create policy "Parents read their own backup" on public.backups for select to authenticated using ((select auth.uid()) = user_id);
create policy "Parents create their own backup" on public.backups for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Parents update their own backup" on public.backups for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Parents delete their own backup" on public.backups for delete to authenticated using ((select auth.uid()) = user_id);
