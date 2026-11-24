-- Failed "email + order number" sign-ins, so order numbers can't be guessed. Server-only (no policies).
create table if not exists public.signin_attempts (
  id bigint generated always as identity primary key,
  email text not null,
  at timestamptz not null default now()
);
create index if not exists signin_attempts_email_at on public.signin_attempts (email, at desc);
alter table public.signin_attempts enable row level security;
