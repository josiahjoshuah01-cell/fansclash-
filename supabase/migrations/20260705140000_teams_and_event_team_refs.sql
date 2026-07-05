-- Teams catalogue (football-data.org) and sporting_events FK migration.

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  name text not null,
  competition text not null,
  logo_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index teams_approved_idx on public.teams (approved) where approved = true;
create index teams_competition_idx on public.teams (competition);

alter table public.teams enable row level security;

create policy "teams_select_authenticated"
  on public.teams
  for select
  to authenticated
  using (true);

create policy "teams_update_admin"
  on public.teams
  for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- Seed legacy teams from existing free-text columns before dropping them.
insert into public.teams (external_id, name, competition, approved)
select
  'legacy-' || md5(lower(trim(name))),
  trim(name),
  'Legacy',
  true
from (
  select team_a as name from public.sporting_events
  union
  select team_b as name from public.sporting_events
) names
where trim(name) <> ''
on conflict (external_id) do nothing;

alter table public.sporting_events
  add column team_a_id uuid references public.teams (id),
  add column team_b_id uuid references public.teams (id);

update public.sporting_events e
set
  team_a_id = ta.id,
  team_b_id = tb.id
from public.teams ta, public.teams tb
where ta.name = e.team_a
  and tb.name = e.team_b;

alter table public.sporting_events
  alter column team_a_id set not null,
  alter column team_b_id set not null;

alter table public.sporting_events
  drop column team_a,
  drop column team_b;

drop function if exists public.create_sporting_event(text, text, timestamptz);

create or replace function public.create_sporting_event(
  p_team_a_id uuid,
  p_team_b_id uuid,
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
  v_team_a public.teams%rowtype;
  v_team_b public.teams%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin_user(v_user_id) then
    raise exception 'Admin access required';
  end if;

  if p_team_a_id is null or p_team_b_id is null then
    raise exception 'Both teams are required';
  end if;

  if p_team_a_id = p_team_b_id then
    raise exception 'Team A and Team B must be different';
  end if;

  if p_kickoff_time is null then
    raise exception 'Kickoff time is required';
  end if;

  select * into v_team_a from public.teams where id = p_team_a_id;
  if not found or not v_team_a.approved then
    raise exception 'Team A is not approved';
  end if;

  select * into v_team_b from public.teams where id = p_team_b_id;
  if not found or not v_team_b.approved then
    raise exception 'Team B is not approved';
  end if;

  insert into public.sporting_events (team_a_id, team_b_id, kickoff_time)
  values (p_team_a_id, p_team_b_id, p_kickoff_time)
  returning * into v_event;

  return v_event;
end;
$$;

grant execute on function public.create_sporting_event(uuid, uuid, timestamptz) to authenticated;

create or replace function public.upsert_team_from_api(
  p_external_id text,
  p_name text,
  p_competition text,
  p_logo_url text
)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team public.teams;
begin
  insert into public.teams (external_id, name, competition, logo_url)
  values (p_external_id, p_name, p_competition, p_logo_url)
  on conflict (external_id) do update
    set
      name = excluded.name,
      logo_url = excluded.logo_url,
      competition = excluded.competition
  returning * into v_team;

  return v_team;
end;
$$;

grant execute on function public.upsert_team_from_api(text, text, text, text) to service_role;
