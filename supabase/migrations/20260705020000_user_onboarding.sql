-- Onboarding: create profile + wallet via SECURITY DEFINER (never client INSERT).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Profile and wallet are created in complete_user_onboarding() after DOB verification.
  return new;
end;
$$;

create or replace function public.complete_user_onboarding(p_date_of_birth date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_age integer;
  v_phone text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_age := date_part('year', age(current_date, p_date_of_birth))::integer;
  if v_age < 18 then
    raise exception 'You must be at least 18 years old to use FansClash';
  end if;

  select coalesce(phone, raw_user_meta_data->>'phone')
  into v_phone
  from auth.users
  where id = v_user_id;

  if v_phone is null or v_phone = '' then
    raise exception 'Phone number not found on auth account';
  end if;

  insert into public.users (id, phone_number, date_of_birth)
  values (v_user_id, v_phone, p_date_of_birth)
  on conflict (id) do update
    set phone_number = excluded.phone_number,
        date_of_birth = excluded.date_of_birth;

  insert into public.wallets (user_id, balance, currency)
  values (v_user_id, 0, 'KES')
  on conflict (user_id) do nothing;
end;
$$;

grant execute on function public.complete_user_onboarding(date) to authenticated;
