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
