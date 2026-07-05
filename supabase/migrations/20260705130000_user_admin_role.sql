-- Admin role on public.users (replaces phone-only allowlist for dashboard access).

alter table public.users
  add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin_user(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select u.is_admin from public.users u where u.id = p_user_id),
    false
  );
$$;

grant execute on function public.is_admin_user(uuid) to authenticated;

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
  v_event public.sporting_events;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin_user(v_user_id) then
    raise exception 'Admin access required';
  end if;

  if nullif(trim(p_team_a), '') is null or nullif(trim(p_team_b), '') is null then
    raise exception 'Both team names are required';
  end if;

  if p_kickoff_time is null then
    raise exception 'Kickoff time is required';
  end if;

  insert into public.sporting_events (team_a, team_b, kickoff_time)
  values (trim(p_team_a), trim(p_team_b), p_kickoff_time)
  returning * into v_event;

  return v_event;
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
  platform_fee_rate constant numeric := 0.05;

  v_user_id uuid := auth.uid();
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

  if not public.is_admin_user(v_user_id) then
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

update public.users u
set is_admin = true
from auth.users au
where u.id = au.id
  and lower(au.email) = lower('alicekemunto20@gmail.com');

insert into public.users (id, phone_number, date_of_birth, is_admin)
select
  au.id,
  null,
  '2000-01-01'::date,
  true
from auth.users au
where lower(au.email) = lower('alicekemunto20@gmail.com')
  and not exists (select 1 from public.users existing where existing.id = au.id)
on conflict (id) do update
  set is_admin = true;

insert into public.wallets (user_id, balance, currency)
select au.id, 0, 'KES'
from auth.users au
where lower(au.email) = lower('alicekemunto20@gmail.com')
on conflict (user_id) do nothing;
