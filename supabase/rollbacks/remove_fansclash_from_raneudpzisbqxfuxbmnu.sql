-- EMERGENCY ROLLBACK: Remove FansClash from shared SealTeam project (raneudpzisbqxfuxbmnu).
-- DO NOT run on FansClash project hvogahprmyrneupsqttw.

alter publication supabase_realtime drop table public.bets;

drop policy if exists "bets_select_scheduled_event_pools" on public.bets;
drop policy if exists "bets_select_own" on public.bets;
drop policy if exists "pending_deposits_select_own" on public.pending_deposits;
drop policy if exists "sporting_events_select_authenticated" on public.sporting_events;
drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "wallets_select_own" on public.wallets;

drop function if exists public.settle_event(uuid, text);
drop function if exists public.lock_event(uuid);
drop function if exists public.place_bet(uuid, text, numeric);
drop function if exists public.create_sporting_event(text, text, timestamptz);
drop function if exists public.credit_wallet_deposit(text);
drop function if exists public.fail_pending_deposit(text, text);
drop function if exists public.complete_user_onboarding(date);

drop table if exists public.compliance_flags cascade;
drop table if exists public.transactions cascade;
drop table if exists public.bets cascade;
drop table if exists public.pending_deposits cascade;
drop table if exists public.sporting_events cascade;
drop table if exists public.wallets cascade;
drop table if exists public.users cascade;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

delete from supabase_migrations.schema_migrations
where version in (
  '20260705005916',
  '20260705010832',
  '20260705011311',
  '20260705011900',
  '20260705012559',
  '20260705013031',
  '20260705013519'
);
