/*
 * FansClash RLS migration
 *
 * Core security principle:
 * Money-affecting writes (wallet balance changes, bet matching/locking/settlement,
 * transaction ledger entries) must NEVER happen via direct client-side Supabase
 * calls. Those operations are restricted to SECURITY DEFINER Postgres functions
 * (and Edge Functions using the service role) that we will add in subsequent
 * prompts. Client roles may only read their own data and perform narrowly scoped
 * inserts where explicitly allowed below.
 */

-- ---------------------------------------------------------------------------
-- auth.users signup trigger
-- Phone OTP creates auth.users first; we seed a provisional public.users row
-- so the profile exists before onboarding. Prompt 4 onboarding will overwrite
-- date_of_birth with the verified value and create the wallet.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, phone_number, date_of_birth)
  values (
    new.id,
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),
    (current_date - interval '18 years')::date
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT policy: rows are created by handle_new_user() trigger (SECURITY DEFINER).

-- ---------------------------------------------------------------------------
-- wallets
-- Wallet balance changes must go through SECURITY DEFINER Postgres functions,
-- never a direct client-side write. Users may only read their own wallet.
-- ---------------------------------------------------------------------------

alter table public.wallets enable row level security;

create policy "wallets_select_own"
  on public.wallets
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No INSERT, UPDATE, or DELETE policies for authenticated users.

-- ---------------------------------------------------------------------------
-- sporting_events
-- ---------------------------------------------------------------------------

alter table public.sporting_events enable row level security;

create policy "sporting_events_select_authenticated"
  on public.sporting_events
  for select
  to authenticated
  using (true);

-- No INSERT/UPDATE/DELETE for authenticated users.
-- Admin writes use the service role, which bypasses RLS.

-- ---------------------------------------------------------------------------
-- bets
-- ---------------------------------------------------------------------------

alter table public.bets enable row level security;

create policy "bets_select_own"
  on public.bets
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "bets_insert_own_on_scheduled_event"
  on public.bets
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.sporting_events e
      where e.id = event_id
        and e.status = 'scheduled'
    )
  );

-- No UPDATE or DELETE for authenticated users.
-- Matching, locking, and settlement use SECURITY DEFINER functions.

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------

alter table public.transactions enable row level security;

create policy "transactions_select_own"
  on public.transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No INSERT, UPDATE, or DELETE for any client role.
-- Written exclusively by SECURITY DEFINER functions.

-- ---------------------------------------------------------------------------
-- compliance_flags
-- ---------------------------------------------------------------------------

alter table public.compliance_flags enable row level security;

-- No policies for authenticated or anon roles.
-- Accessible only via service role for now.
