alter table public.teams
  add column if not exists rejected boolean not null default false;

create or replace function public.admin_review_team(
  p_external_id text,
  p_name text,
  p_competition text,
  p_logo_url text,
  p_approved boolean
)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team public.teams;
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

  insert into public.teams (external_id, name, competition, logo_url, approved, rejected)
  values (
    p_external_id,
    p_name,
    p_competition,
    p_logo_url,
    p_approved,
    not p_approved
  )
  on conflict (external_id) do update
    set
      name = excluded.name,
      logo_url = excluded.logo_url,
      competition = excluded.competition,
      approved = excluded.approved,
      rejected = excluded.rejected
  returning * into v_team;

  return v_team;
end;
$$;

grant execute on function public.admin_review_team(text, text, text, text, boolean) to authenticated;
