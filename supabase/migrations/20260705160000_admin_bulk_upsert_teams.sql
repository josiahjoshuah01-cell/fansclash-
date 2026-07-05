create or replace function public.admin_bulk_upsert_teams(p_teams jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team jsonb;
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if not exists (
    select 1
    from public.users
    where id = auth.uid()
      and is_admin = true
  ) then
    raise exception 'Admin access required';
  end if;

  for v_team in
    select value
    from jsonb_array_elements(p_teams)
  loop
    perform public.upsert_team_from_api(
      v_team->>'external_id',
      v_team->>'name',
      v_team->>'competition',
      v_team->>'logo_url'
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.admin_bulk_upsert_teams(jsonb) to authenticated;
