-- M-Pesa B2C withdrawals: pending records, wallet lock, callback reconciliation.
-- Phone on public.users is set on first successful deposit (verified payout destination).

alter table public.users
  alter column phone_number drop not null;

comment on column public.users.phone_number is
  'Verified M-Pesa number from the user''s first successful deposit. Required before withdrawal.';

-- Withdrawal ledger rows carry a reconcilable status; all other types leave status null.
alter table public.transactions
  add column if not exists status text
    check (status is null or status in ('pending', 'completed', 'failed'));

alter table public.transactions
  add column if not exists external_ref text;

comment on column public.transactions.status is
  'Set for withdrawal rows only: pending at initiation, completed/failed via B2C callback.';

create table public.pending_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  transaction_id uuid not null references public.transactions (id) on delete restrict,
  originator_conversation_id text not null unique,
  conversation_id text,
  amount numeric not null check (amount > 0),
  phone_number text not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  result_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pending_withdrawals_user_id_idx on public.pending_withdrawals (user_id);
create index pending_withdrawals_status_idx on public.pending_withdrawals (status);

alter table public.pending_withdrawals enable row level security;

create policy "pending_withdrawals_select_own"
  on public.pending_withdrawals
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Google/email users may onboard without a phone; M-Pesa verifies it on first deposit.
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

  insert into public.users (id, phone_number, date_of_birth)
  values (v_user_id, nullif(trim(v_phone), ''), p_date_of_birth)
  on conflict (id) do update
    set date_of_birth = excluded.date_of_birth;

  insert into public.wallets (user_id, balance, currency)
  values (v_user_id, 0, 'KES')
  on conflict (user_id) do nothing;
end;
$$;

-- Persist verified M-Pesa phone when a deposit succeeds.
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

  update public.users
  set phone_number = v_deposit.phone_number
  where id = v_deposit.user_id;

  update public.pending_deposits
  set status = 'completed',
      updated_at = now()
  where id = v_deposit.id;
end;
$$;

create or replace function public.lock_funds_for_withdrawal(
  p_user_id uuid,
  p_originator_conversation_id text,
  p_amount numeric,
  p_phone_number text
)
returns table (
  pending_withdrawal_id uuid,
  transaction_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
  v_new_balance numeric;
  v_tx_id uuid;
  v_pending_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Withdrawal amount must be positive';
  end if;

  if p_phone_number is null or trim(p_phone_number) = '' then
    raise exception 'Verified M-Pesa phone number required';
  end if;

  select balance
  into v_balance
  from public.wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Wallet not found';
  end if;

  if v_balance < p_amount then
    raise exception 'Insufficient wallet balance';
  end if;

  update public.wallets
  set balance = balance - p_amount,
      updated_at = now()
  where user_id = p_user_id
  returning balance into v_new_balance;

  insert into public.transactions (
    user_id,
    type,
    amount,
    balance_after,
    status,
    external_ref
  )
  values (
    p_user_id,
    'withdrawal',
    p_amount,
    v_new_balance,
    'pending',
    p_originator_conversation_id
  )
  returning id into v_tx_id;

  insert into public.pending_withdrawals (
    user_id,
    transaction_id,
    originator_conversation_id,
    amount,
    phone_number,
    status
  )
  values (
    p_user_id,
    v_tx_id,
    p_originator_conversation_id,
    p_amount,
    p_phone_number,
    'pending'
  )
  returning id into v_pending_id;

  pending_withdrawal_id := v_pending_id;
  transaction_id := v_tx_id;
  return next;
end;
$$;

create or replace function public.complete_pending_withdrawal(
  p_originator_conversation_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pending public.pending_withdrawals%rowtype;
begin
  select *
  into v_pending
  from public.pending_withdrawals
  where originator_conversation_id = p_originator_conversation_id
  for update;

  if not found then
    raise exception 'Pending withdrawal not found for %', p_originator_conversation_id;
  end if;

  if v_pending.status = 'completed' then
    return;
  end if;

  if v_pending.status <> 'pending' then
    raise exception 'Withdrawal % is not pending', p_originator_conversation_id;
  end if;

  update public.transactions
  set status = 'completed'
  where id = v_pending.transaction_id;

  update public.pending_withdrawals
  set status = 'completed',
      updated_at = now()
  where id = v_pending.id;
end;
$$;

create or replace function public.fail_pending_withdrawal_refund(
  p_originator_conversation_id text,
  p_result_description text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pending public.pending_withdrawals%rowtype;
  v_new_balance numeric;
begin
  select *
  into v_pending
  from public.pending_withdrawals
  where originator_conversation_id = p_originator_conversation_id
  for update;

  if not found then
    raise exception 'Pending withdrawal not found for %', p_originator_conversation_id;
  end if;

  if v_pending.status = 'failed' then
    return;
  end if;

  if v_pending.status = 'completed' then
    raise exception 'Cannot fail completed withdrawal %', p_originator_conversation_id;
  end if;

  update public.wallets
  set balance = balance + v_pending.amount,
      updated_at = now()
  where user_id = v_pending.user_id
  returning balance into v_new_balance;

  update public.transactions
  set status = 'failed'
  where id = v_pending.transaction_id;

  update public.pending_withdrawals
  set status = 'failed',
      result_description = coalesce(p_result_description, result_description),
      updated_at = now()
  where id = v_pending.id;
end;
$$;

create or replace function public.attach_withdrawal_conversation_id(
  p_originator_conversation_id text,
  p_conversation_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pending_withdrawals
  set conversation_id = p_conversation_id,
      updated_at = now()
  where originator_conversation_id = p_originator_conversation_id
    and status = 'pending';
end;
$$;

grant execute on function public.lock_funds_for_withdrawal(uuid, text, numeric, text) to service_role;
grant execute on function public.complete_pending_withdrawal(text) to service_role;
grant execute on function public.fail_pending_withdrawal_refund(text, text) to service_role;
grant execute on function public.attach_withdrawal_conversation_id(text, text) to service_role;
