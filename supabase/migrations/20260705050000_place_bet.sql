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
