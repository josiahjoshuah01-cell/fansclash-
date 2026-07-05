-- Phone number policy: users.phone_number is set once by credit_wallet_deposit only.

-- Remove internal placeholder values seeded for admin bootstrap accounts.
update public.users
set phone_number = null
where phone_number ~ '^(admin-|user-|placeholder-)';

-- Admin bootstrap: never seed a fake phone_number.
create or replace function public.bootstrap_admin_user(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(p_email);

  if v_user_id is null then
    return;
  end if;

  insert into public.users (id, phone_number, date_of_birth, is_admin)
  values (v_user_id, null, '2000-01-01'::date, true)
  on conflict (id) do update
    set is_admin = true;

  insert into public.wallets (user_id, balance, currency)
  values (v_user_id, 0, 'KES')
  on conflict (user_id) do nothing;
end;
$$;

select public.bootstrap_admin_user('alicekemunto20@gmail.com');

drop function public.bootstrap_admin_user(text);

-- Onboarding never pre-populates phone_number — only a completed deposit may set it.
create or replace function public.complete_user_onboarding(p_date_of_birth date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_age integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_age := date_part('year', age(current_date, p_date_of_birth))::integer;
  if v_age < 18 then
    raise exception 'You must be at least 18 years old to use FansClash';
  end if;

  insert into public.users (id, phone_number, date_of_birth)
  values (v_user_id, null, p_date_of_birth)
  on conflict (id) do update
    set date_of_birth = excluded.date_of_birth;

  insert into public.wallets (user_id, balance, currency)
  values (v_user_id, 0, 'KES')
  on conflict (user_id) do nothing;
end;
$$;

-- Set verified phone exactly once on the first successful deposit.
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

  perform set_config('app.allow_phone_verification', 'true', true);

  update public.users
  set phone_number = v_deposit.phone_number
  where id = v_deposit.user_id
    and phone_number is null;

  update public.pending_deposits
  set status = 'completed',
      updated_at = now()
  where id = v_deposit.id;
end;
$$;

create or replace function public.guard_users_phone_number()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.phone_number is not null
      and current_setting('app.allow_phone_verification', true) is distinct from 'true' then
      raise exception 'phone_number can only be set by a completed M-Pesa deposit';
    end if;
    return new;
  end if;

  if new.phone_number is distinct from old.phone_number then
    if current_setting('app.allow_phone_verification', true) = 'true'
      and old.phone_number is null then
      return new;
    end if;
    raise exception 'phone_number is immutable once set';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_users_phone_number on public.users;

create trigger guard_users_phone_number
  before insert or update of phone_number on public.users
  for each row
  execute function public.guard_users_phone_number();

comment on column public.users.phone_number is
  'Verified M-Pesa MSISDN. Set exactly once by credit_wallet_deposit(); never user-editable.';
