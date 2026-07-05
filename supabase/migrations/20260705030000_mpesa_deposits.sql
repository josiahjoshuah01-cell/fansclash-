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
