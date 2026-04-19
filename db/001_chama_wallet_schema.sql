create extension if not exists pgcrypto;

set search_path to public, auth;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_sign_in_at timestamptz
);

create table if not exists public.groups (
  id bigint generated always as identity primary key,
  name text not null,
  group_type text not null default 'savings' check (
    group_type in (
      'savings',
      'investment',
      'welfare',
      'table-banking',
      'business',
      'sacco-like',
      'hybrid'
    )
  ),
  description text,
  monthly_contribution numeric(12, 2) not null default 0,
  max_members integer not null default 30,
  join_code text,
  join_fee numeric(12, 2) not null default 150,
  meeting_day text,
  payout_style text,
  next_contribution_date timestamptz,
  wallet_transparency boolean not null default true,
  member_list_visibility text not null default 'members-only' check (
    member_list_visibility in ('public', 'members-only')
  ),
  profile_image_url text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.groups add column if not exists group_type text;
alter table if exists public.groups add column if not exists max_members integer default 30;
alter table if exists public.groups add column if not exists join_code text;
alter table if exists public.groups add column if not exists join_fee numeric(12, 2) default 150;
alter table if exists public.groups add column if not exists meeting_day text;
alter table if exists public.groups add column if not exists payout_style text;
alter table if exists public.groups add column if not exists next_contribution_date timestamptz;
alter table if exists public.groups add column if not exists wallet_transparency boolean default true;
alter table if exists public.groups add column if not exists member_list_visibility text default 'members-only';
alter table if exists public.groups add column if not exists profile_image_url text;
alter table if exists public.groups add column if not exists updated_at timestamptz default now();

do $$
begin
  alter table public.groups
    add constraint groups_group_type_check
    check (
      group_type in (
        'savings',
        'investment',
        'welfare',
        'table-banking',
        'business',
        'sacco-like',
        'hybrid'
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.groups
    add constraint groups_member_list_visibility_check
    check (member_list_visibility in ('public', 'members-only'));
exception
  when duplicate_object then null;
end $$;

create unique index if not exists groups_join_code_key
  on public.groups (join_code)
  where join_code is not null;

create table if not exists public.group_members (
  id bigint generated always as identity primary key,
  group_id bigint not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  contribution_status text not null default 'pending' check (contribution_status in ('on-track', 'pending')),
  total_contributed numeric(12, 2) not null default 0,
  accepted_terms boolean not null default false,
  join_fee_paid boolean not null default false,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

alter table if exists public.group_members add column if not exists accepted_terms boolean default false;
alter table if exists public.group_members add column if not exists join_fee_paid boolean default false;
alter table if exists public.group_members add column if not exists created_at timestamptz default now();

do $$
begin
  alter table public.group_members
    add constraint group_members_contribution_status_check
    check (contribution_status in ('on-track', 'pending'));
exception
  when duplicate_object then null;
end $$;

create table if not exists public.group_ledger (
  id bigint generated always as identity primary key,
  group_id bigint not null references public.groups (id) on delete cascade,
  member_id bigint references public.group_members (id) on delete set null,
  type text not null check (
    type in ('join_fee', 'contribution', 'withdrawal', 'loan_disbursement', 'loan_repayment')
  ),
  direction text not null check (direction in ('in', 'out')),
  amount numeric(12, 2) not null check (amount >= 0),
  payment_method text not null check (payment_method in ('mpesa', 'bank', 'wallet')),
  note text,
  reference text,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists group_ledger_group_id_created_at_idx
  on public.group_ledger (group_id, created_at desc);

create table if not exists public.group_loans (
  id bigint generated always as identity primary key,
  group_id bigint not null references public.groups (id) on delete cascade,
  member_id bigint references public.group_members (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  purpose text,
  interest_rate numeric(5, 2) not null default 0,
  repayment_period integer not null default 1,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'declined', 'active', 'closed')
  ),
  remaining_balance numeric(12, 2),
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  next_payment_date timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.group_messages (
  id bigint generated always as identity primary key,
  group_id bigint not null references public.groups (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  user_name text not null,
  user_avatar text,
  user_role text not null default 'member' check (user_role in ('admin', 'member')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists group_messages_group_id_created_at_idx
  on public.group_messages (group_id, created_at desc);
