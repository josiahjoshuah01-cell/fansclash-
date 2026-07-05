-- FansClash full schema for project hvogahprmyrneupsqttw ONLY
-- Run in Supabase Dashboard -> SQL Editor on the FansClash project.


-- ===== 20260705000000_initial_schema.sql =====

-- FansClash core schema (Kenya MVP)

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  phone_number text not null unique,
  date_of_birth date not null,
  kyc_status text not null default 'none'
    check (kyc_status in ('none', 'pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  balance numeric not null default 0,
  currency text not null default 'KES',
  updated_at timestamptz not null default now()
);

create table public.sporting_events (
  id uuid primary key default gen_random_uuid(),
  team_a text not null,
  team_b text not null,
  kickoff_time timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'locked', 'completed', 'voided')),
  result text
    check (result is null or result in ('team_a', 'team_b', 'draw')),
  created_at timestamptz not null default now()
);

create table public.bets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.sporting_events (id) on delete restrict,
  user_id uuid not null references public.users (id) on delete cascade,
  side text not null check (side in ('team_a', 'team_b')),
  stake_amount numeric not null check (stake_amount > 0),
  matched_amount numeric not null default 0,
  unmatched_amount numeric not null default 0,
  status text not null default 'open'
    check (status in (
      'open',
      'partially_matched',
      'fully_matched',
      'locked',
      'settled',
      'voided'
    )),
  payout_amount numeric,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  bet_id uuid references public.bets (id) on delete set null,
  type text not null
    check (type in (
      'deposit',
      'withdrawal',
      'stake_lock',
      'unmatched_refund',
      'payout',
      'fee',
      'ctr_flag'
    )),
  amount numeric not null,
  balance_after numeric not null,
  created_at timestamptz not null default now()
);

comment on table public.transactions is
  'Append-only ledger. Rows must never be updated or deleted.';

create table public.compliance_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  flag_type text not null
    check (flag_type in ('ctr_threshold', 'suspicious_pattern')),
  amount numeric,
  details jsonb,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.compliance_flags is
  'Dormant for MVP — structure only. Becomes active once KYC/AML rules are finalized with legal counsel.';

-- Lookup indexes
create index bets_user_id_idx on public.bets (user_id);
create index bets_event_id_idx on public.bets (event_id);
create index transactions_user_id_idx on public.transactions (user_id);
create index compliance_flags_user_id_idx on public.compliance_flags (user_id);

-- ===== 20260705010000_row_level_security.sql =====

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

-- ===== 20260705020000_user_onboarding.sql =====

-- Onboarding: create profile + wallet via SECURITY DEFINER (never client INSERT).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Profile and wallet are created in complete_user_onboarding() after DOB verification.
  return new;
end;
$$;

create or replace function public.complete_user_onboarding(p_date_of_birth date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_age integer;
  v_phone text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_age := date_part('year', age(current_date, p_date_of_birth))::integer;
  if v_age < 18 then
    raise exception 'You must be at least 18 years old to use FansClash';
  end if;

  select coalesce(phone, raw_user_meta_data->>'phone')
  into v_phone
  from auth.users
  where id = v_user_id;

  if v_phone is null or v_phone = '' then
    raise exception 'Phone number not found on auth account';
  end if;

  insert into public.users (id, phone_number, date_of_birth)
  values (v_user_id, v_phone, p_date_of_birth)
  on conflict (id) do update
    set phone_number = excluded.phone_number,
        date_of_birth = excluded.date_of_birth;

  insert into public.wallets (user_id, balance, currency)
  values (v_user_id, 0, 'KES')
  on conflict (user_id) do nothing;
end;
$$;

grant execute on function public.complete_user_onboarding(date) to authenticated;

-- ===== 20260705030000_mpesa_deposits.sql =====

-- Pending M-Pesa STK deposits + atomic wallet credit on callback success.

create table public.pending_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  checkout_request_id text not null unique,
  merchant_request_id text,
  amount numeric not null check (amount > 0),
  phone_number text not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  result_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pending_deposits_user_id_idx on public.pending_deposits (user_id);
create index pending_deposits_status_idx on public.pending_deposits (status);

alter table public.pending_deposits enable row level security;

create policy "pending_deposits_select_own"
  on public.pending_deposits
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Inserts/updates only via Edge Functions (service role) or SECURITY DEFINER RPCs.

create or replace function public.credit_wallet_deposit(p_checkout_request_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deposit public.pending_deposits%rowtype;
  v_new_balance numeric;
begin
  select *
  into v_deposit
  from public.pending_deposits
  where checkout_request_id = p_checkout_request_id
  for update;

  if not found then
    raise exception 'Pending deposit not found for checkout request %', p_checkout_request_id;
  end if;

  if v_deposit.status = 'completed' then
    return;
  end if;

  if v_deposit.status <> 'pending' then
    raise exception 'Deposit % is not pending', p_checkout_request_id;
  end if;

  update public.wallets
  set balance = balance + v_deposit.amount,
      updated_at = now()
  where user_id = v_deposit.user_id
  returning balance into v_new_balance;

  if not found then
    raise exception 'Wallet not found for user %', v_deposit.user_id;
  end if;

  insert into public.transactions (user_id, type, amount, balance_after)
  values (v_deposit.user_id, 'deposit', v_deposit.amount, v_new_balance);

  update public.pending_deposits
  set status = 'completed',
      updated_at = now()
  where id = v_deposit.id;
end;
$$;

create or replace function public.fail_pending_deposit(
  p_checkout_request_id text,
  p_result_description text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pending_deposits
  set status = 'failed',
      result_description = coalesce(p_result_description, result_description),
      updated_at = now()
  where checkout_request_id = p_checkout_request_id
    and status = 'pending';
end;
$$;

grant execute on function public.credit_wallet_deposit(text) to service_role;
grant execute on function public.fail_pending_deposit(text, text) to service_role;

-- ===== 20260705040000_admin_events_and_realtime.sql =====

-- Admin event creation + pool visibility for live totals.
-- TODO: replace hardcoded admin phone with a proper role system before production launch.

create or replace function public.create_sporting_event(
  p_team_a text,
  p_team_b text,
  p_kickoff_time timestamptz
)
returns public.sporting_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_phone text;
  v_event public.sporting_events;
  -- Hardcoded admin allowlist for MVP only.
  v_admin_phones text[] := array['+254700000000', '254700000000'];
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if nullif(trim(p_team_a), '') is null or nullif(trim(p_team_b), '') is null then
    raise exception 'Both team names are required';
  end if;

  if p_kickoff_time is null then
    raise exception 'Kickoff time is required';
  end if;

  select coalesce(phone, raw_user_meta_data->>'phone')
  into v_phone
  from auth.users
  where id = v_user_id;

  if v_phone is null or not (v_phone = any (v_admin_phones)) then
    raise exception 'Admin access required';
  end if;

  insert into public.sporting_events (team_a, team_b, kickoff_time)
  values (trim(p_team_a), trim(p_team_b), p_kickoff_time)
  returning * into v_event;

  return v_event;
end;
$$;

grant execute on function public.create_sporting_event(text, text, timestamptz) to authenticated;

-- Allow authenticated users to read bets on scheduled events for live pool totals.
-- Individual bet rows are visible for matching transparency during the open window.
-- TODO: narrow to aggregate-only exposure before production if privacy requires it.
create policy "bets_select_scheduled_event_pools"
  on public.bets
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sporting_events e
      where e.id = bets.event_id
        and e.status = 'scheduled'
    )
  );

-- Realtime pool updates on the bets table.
alter publication supabase_realtime add table public.bets;

-- ===== 20260705050000_place_bet.sql =====

-- place_bet: atomic stake, wallet debit, and pro-rata matching for an event.
-- Direct client INSERT on bets is removed; all stakes go through this function.

drop policy if exists "bets_insert_own_on_scheduled_event" on public.bets;

create or replace function public.place_bet(
  p_event_id uuid,
  p_side text,
  p_amount numeric
)
returns public.bets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event public.sporting_events%rowtype;
  v_wallet public.wallets%rowtype;
  v_new_balance numeric;
  v_bet public.bets%rowtype;
  v_total_a numeric;
  v_total_b numeric;
  v_matched_total numeric;
  v_ratio_a numeric;
  v_ratio_b numeric;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_side not in ('team_a', 'team_b') then
    raise exception 'Invalid side';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Stake amount must be positive';
  end if;

  -- Serialize all matching for this event (prevents concurrent ratio corruption).
  select *
  into v_event
  from public.sporting_events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found';
  end if;

  if v_event.status <> 'scheduled' then
    raise exception 'Event is not open for betting';
  end if;

  select *
  into v_wallet
  from public.wallets
  where user_id = v_user_id
  for update;

  if not found then
    raise exception 'Wallet not found';
  end if;

  if v_wallet.balance < p_amount then
    raise exception 'Insufficient wallet balance';
  end if;

  update public.wallets
  set balance = balance - p_amount,
      updated_at = now()
  where user_id = v_user_id
  returning balance into v_new_balance;

  insert into public.bets (
    event_id,
    user_id,
    side,
    stake_amount,
    matched_amount,
    unmatched_amount,
    status
  )
  values (
    p_event_id,
    v_user_id,
    p_side,
    p_amount,
    0,
    0,
    'open'
  )
  returning * into v_bet;

  insert into public.transactions (user_id, bet_id, type, amount, balance_after)
  values (v_user_id, v_bet.id, 'stake_lock', p_amount, v_new_balance);

  -- Step 5: pro-rata matching across both sides.
  -- total_a / total_b = gross stakes on each side (all active matching statuses).
  select
    coalesce(sum(stake_amount) filter (where side = 'team_a'), 0),
    coalesce(sum(stake_amount) filter (where side = 'team_b'), 0)
  into v_total_a, v_total_b
  from public.bets
  where event_id = p_event_id
    and status in ('open', 'partially_matched', 'fully_matched');

  -- matched_total = the overlapping pool (smaller side fully matches, larger side pro-rata).
  v_matched_total := least(v_total_a, v_total_b);

  -- ratio_a = fraction of each team_a stake that finds a counterparty on team_b.
  if v_total_a > 0 then
    v_ratio_a := v_matched_total / v_total_a;
  else
    v_ratio_a := 0;
  end if;

  if v_total_b > 0 then
    v_ratio_b := v_matched_total / v_total_b;
  else
    v_ratio_b := 0;
  end if;

  -- Apply ratio_a to every team_a bet: matched = stake * ratio, unmatched = stake * (1 - ratio).
  update public.bets b
  set
    matched_amount = round(b.stake_amount * v_ratio_a, 2),
    unmatched_amount = round(b.stake_amount * (1 - v_ratio_a), 2),
    status = case
      when v_ratio_a >= 0.999 then 'fully_matched'
      when round(b.stake_amount * v_ratio_a, 2) > 0 then 'partially_matched'
      else 'open'
    end
  where b.event_id = p_event_id
    and b.side = 'team_a'
    and b.status in ('open', 'partially_matched', 'fully_matched');

  -- Same for team_b using ratio_b.
  update public.bets b
  set
    matched_amount = round(b.stake_amount * v_ratio_b, 2),
    unmatched_amount = round(b.stake_amount * (1 - v_ratio_b), 2),
    status = case
      when v_ratio_b >= 0.999 then 'fully_matched'
      when round(b.stake_amount * v_ratio_b, 2) > 0 then 'partially_matched'
      else 'open'
    end
  where b.event_id = p_event_id
    and b.side = 'team_b'
    and b.status in ('open', 'partially_matched', 'fully_matched');

  select *
  into v_bet
  from public.bets
  where id = v_bet.id;

  return v_bet;
end;
$$;

grant execute on function public.place_bet(uuid, text, numeric) to authenticated;

-- ===== 20260705060000_lock_and_settle.sql =====

-- Kickoff lock + settlement (idempotent, SECURITY DEFINER).

create or replace function public.lock_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.sporting_events%rowtype;
  v_bet public.bets%rowtype;
  v_new_balance numeric;
begin
  select *
  into v_event
  from public.sporting_events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found';
  end if;

  -- Idempotent: cron may call again after the event is already locked.
  if v_event.status <> 'scheduled' then
    return;
  end if;

  if v_event.kickoff_time > now() then
    raise exception 'Event has not reached kickoff yet';
  end if;

  update public.sporting_events
  set status = 'locked'
  where id = p_event_id;

  for v_bet in
    select *
    from public.bets
    where event_id = p_event_id
    for update
  loop
    if v_bet.unmatched_amount > 0 then
      update public.wallets
      set balance = balance + v_bet.unmatched_amount,
          updated_at = now()
      where user_id = v_bet.user_id
      returning balance into v_new_balance;

      insert into public.transactions (user_id, bet_id, type, amount, balance_after)
      values (
        v_bet.user_id,
        v_bet.id,
        'unmatched_refund',
        v_bet.unmatched_amount,
        v_new_balance
      );

      update public.bets
      set unmatched_amount = 0
      where id = v_bet.id;
    end if;

    if v_bet.matched_amount > 0 then
      update public.bets
      set status = 'locked'
      where id = v_bet.id;
    else
      -- Nothing was matched — stake fully refunded above; no active locked portion remains.
      update public.bets
      set status = 'settled'
      where id = v_bet.id;
    end if;
  end loop;
end;
$$;

create or replace function public.settle_event(
  p_event_id uuid,
  p_result text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Easy to find/adjust platform take rate.
  platform_fee_rate constant numeric := 0.05;

  v_user_id uuid := auth.uid();
  v_phone text;
  v_admin_phones text[] := array['+254700000000', '254700000000'];
  v_event public.sporting_events%rowtype;
  v_bet public.bets%rowtype;
  v_new_balance numeric;
  v_winning_total numeric;
  v_losing_total numeric;
  v_their_share numeric;
  v_fee numeric;
  v_payout numeric;
  v_losing_side text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(phone, raw_user_meta_data->>'phone')
  into v_phone
  from auth.users
  where id = v_user_id;

  if v_phone is null or not (v_phone = any (v_admin_phones)) then
    raise exception 'Admin access required';
  end if;

  if p_result not in ('team_a', 'team_b', 'draw') then
    raise exception 'Invalid result';
  end if;

  select *
  into v_event
  from public.sporting_events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found';
  end if;

  -- Idempotent: never double-pay — reject if already settled.
  if v_event.status in ('completed', 'voided') then
    raise exception 'Event already settled';
  end if;

  if v_event.status <> 'locked' then
    raise exception 'Event must be locked before settlement';
  end if;

  if p_result = 'draw' then
    for v_bet in
      select *
      from public.bets
      where event_id = p_event_id
        and matched_amount > 0
      for update
    loop
      update public.wallets
      set balance = balance + v_bet.matched_amount,
          updated_at = now()
      where user_id = v_bet.user_id
      returning balance into v_new_balance;

      insert into public.transactions (user_id, bet_id, type, amount, balance_after)
      values (
        v_bet.user_id,
        v_bet.id,
        'payout',
        v_bet.matched_amount,
        v_new_balance
      );

      update public.bets
      set status = 'voided',
          payout_amount = v_bet.matched_amount
      where id = v_bet.id;
    end loop;

    update public.bets
    set status = 'voided'
    where event_id = p_event_id
      and status = 'locked';

    update public.sporting_events
    set status = 'voided',
        result = 'draw'
    where id = p_event_id;

    return;
  end if;

  v_losing_side := case when p_result = 'team_a' then 'team_b' else 'team_a' end;

  select coalesce(sum(matched_amount), 0)
  into v_winning_total
  from public.bets
  where event_id = p_event_id
    and side = p_result
    and matched_amount > 0
    and status = 'locked';

  select coalesce(sum(matched_amount), 0)
  into v_losing_total
  from public.bets
  where event_id = p_event_id
    and side = v_losing_side
    and matched_amount > 0
    and status = 'locked';

  for v_bet in
    select *
    from public.bets
    where event_id = p_event_id
      and side = p_result
      and matched_amount > 0
      and status = 'locked'
    for update
  loop
    if v_winning_total > 0 then
      v_their_share := (v_bet.matched_amount / v_winning_total) * v_losing_total;
    else
      v_their_share := 0;
    end if;

    v_fee := round(v_their_share * platform_fee_rate, 2);
    v_payout := v_bet.matched_amount + (v_their_share - v_fee);

    update public.wallets
    set balance = balance + v_payout,
        updated_at = now()
    where user_id = v_bet.user_id
    returning balance into v_new_balance;

    insert into public.transactions (user_id, bet_id, type, amount, balance_after)
    values (v_bet.user_id, v_bet.id, 'payout', v_payout, v_new_balance);

    if v_fee > 0 then
      insert into public.transactions (user_id, bet_id, type, amount, balance_after)
      values (v_bet.user_id, v_bet.id, 'fee', v_fee, v_new_balance);
    end if;

    update public.bets
    set status = 'settled',
        payout_amount = v_payout
    where id = v_bet.id;
  end loop;

  update public.bets
  set status = 'settled'
  where event_id = p_event_id
    and side = v_losing_side
    and status = 'locked';

  update public.sporting_events
  set status = 'completed',
      result = p_result
  where id = p_event_id;
end;
$$;

grant execute on function public.lock_event(uuid) to service_role;
grant execute on function public.settle_event(uuid, text) to authenticated;
