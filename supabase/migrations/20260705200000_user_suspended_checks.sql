-- Account suspension flag + enforce on money-moving paths.

alter table public.users
  add column if not exists is_suspended boolean not null default false;

comment on column public.users.is_suspended is
  'When true, user cannot deposit, withdraw, or place bets.';

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
  v_suspended boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select is_suspended into v_suspended
  from public.users
  where id = v_user_id;

  if coalesce(v_suspended, false) then
    raise exception 'Your account is suspended. Contact support for assistance.';
  end if;

  if p_side not in ('team_a', 'team_b') then
    raise exception 'Invalid side';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Stake amount must be positive';
  end if;

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

  select
    coalesce(sum(stake_amount) filter (where side = 'team_a'), 0),
    coalesce(sum(stake_amount) filter (where side = 'team_b'), 0)
  into v_total_a, v_total_b
  from public.bets
  where event_id = p_event_id
    and status in ('open', 'partially_matched', 'fully_matched');

  v_matched_total := least(v_total_a, v_total_b);

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
  v_suspended boolean;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Withdrawal amount must be positive';
  end if;

  if p_phone_number is null or trim(p_phone_number) = '' then
    raise exception 'Verified M-Pesa phone number required';
  end if;

  select is_suspended into v_suspended
  from public.users
  where id = p_user_id;

  if coalesce(v_suspended, false) then
    raise exception 'Your account is suspended. Contact support for assistance.';
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
