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
