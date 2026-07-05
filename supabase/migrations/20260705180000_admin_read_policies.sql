-- Admin read access for dashboard stats and operations pages.

create policy "users_select_admin"
  on public.users
  for select
  to authenticated
  using (public.is_admin_user());

create policy "transactions_select_admin"
  on public.transactions
  for select
  to authenticated
  using (public.is_admin_user());

create policy "bets_select_admin"
  on public.bets
  for select
  to authenticated
  using (public.is_admin_user());

create or replace function public.admin_dashboard_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Admin access required';
  end if;

  return json_build_object(
    'scheduled_events', (
      select count(*)::int from public.sporting_events where status = 'scheduled'
    ),
    'locked_events', (
      select count(*)::int from public.sporting_events where status = 'locked'
    ),
    'total_pool_value', (
      select coalesce(sum(b.matched_amount), 0)::numeric
      from public.bets b
      inner join public.sporting_events e on e.id = b.event_id
      where e.status in ('scheduled', 'locked')
    ),
    'registered_users', (
      select count(*)::int from public.users
    )
  );
end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;
