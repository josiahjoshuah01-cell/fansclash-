-- FansClash core schema (Kenya MVP)

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  phone_number text not null unique,
  date_of_birth date not null,
  kyc_status text not null default 'none'
    check (kyc_status in ('none', 'pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  balance numeric not null default 0,
  currency text not null default 'KES',
  updated_at timestamptz not null default now()
);

create table public.sporting_events (
  id uuid primary key default gen_random_uuid(),
  team_a text not null,
  team_b text not null,
  kickoff_time timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'locked', 'completed', 'voided')),
  result text
    check (result is null or result in ('team_a', 'team_b', 'draw')),
  created_at timestamptz not null default now()
);

create table public.bets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.sporting_events (id) on delete restrict,
  user_id uuid not null references public.users (id) on delete cascade,
  side text not null check (side in ('team_a', 'team_b')),
  stake_amount numeric not null check (stake_amount > 0),
  matched_amount numeric not null default 0,
  unmatched_amount numeric not null default 0,
  status text not null default 'open'
    check (status in (
      'open',
      'partially_matched',
      'fully_matched',
      'locked',
      'settled',
      'voided'
    )),
  payout_amount numeric,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  bet_id uuid references public.bets (id) on delete set null,
  type text not null
    check (type in (
      'deposit',
      'withdrawal',
      'stake_lock',
      'unmatched_refund',
      'payout',
      'fee',
      'ctr_flag'
    )),
  amount numeric not null,
  balance_after numeric not null,
  created_at timestamptz not null default now()
);

comment on table public.transactions is
  'Append-only ledger. Rows must never be updated or deleted.';

create table public.compliance_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  flag_type text not null
    check (flag_type in ('ctr_threshold', 'suspicious_pattern')),
  amount numeric,
  details jsonb,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.compliance_flags is
  'Dormant for MVP — structure only. Becomes active once KYC/AML rules are finalized with legal counsel.';

-- Lookup indexes
create index bets_user_id_idx on public.bets (user_id);
create index bets_event_id_idx on public.bets (event_id);
create index transactions_user_id_idx on public.transactions (user_id);
create index compliance_flags_user_id_idx on public.compliance_flags (user_id);
