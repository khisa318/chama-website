-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (Profiles)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text unique not null,
  phone text unique,  -- Kenyan format: +2547XXXXXXXX
  avatar_url text,
  role text not null default 'user', -- user | admin
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Groups
create table if not exists public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  type text not null,  -- savings | table_banking | investment | welfare | sacco
  invite_code text unique,
  contribution_amount numeric(15, 2) not null default 0,
  contribution_frequency text not null, -- weekly | monthly | custom
  contribution_day int,
  loan_interest_rate numeric(5, 2) default 0,
  max_loan_multiplier numeric(5, 2) default 3,
  loan_repayment_months int default 12,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Group members (junction)
create table if not exists public.group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text not null,  -- admin | treasurer | secretary | member
  status text not null default 'active',  -- active | suspended | left
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- Contributions
create table if not exists public.contributions (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  amount numeric(15, 2) not null,
  month_year text not null,  -- "2025-01" format
  payment_method text not null,  -- mpesa | cash | bank
  mpesa_code text,
  status text not null default 'pending',  -- paid | pending | overdue
  recorded_by uuid references public.users(id),
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Loans
create table if not exists public.loans (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade,
  borrower_id uuid references public.users(id) on delete cascade,
  amount numeric(15, 2) not null,
  interest_rate numeric(5, 2) not null,
  repayment_months int not null,
  purpose text,
  status text not null default 'pending',  -- pending | active | paid | defaulted | rejected
  disbursed_at timestamptz,
  approved_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Loan repayments
create table if not exists public.loan_repayments (
  id uuid primary key default uuid_generate_v4(),
  loan_id uuid references public.loans(id) on delete cascade,
  month_number int not null,
  due_date date not null,
  principal numeric(15, 2) not null,
  interest numeric(15, 2) not null,
  total_due numeric(15, 2) not null,
  amount_paid numeric(15, 2) default 0,
  mpesa_code text,
  status text not null default 'pending',  -- pending | paid | overdue
  paid_at timestamptz
);

-- Investments
create table if not exists public.investments (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade,
  name text not null,
  type text not null,  -- unit_trust | shares | property | fixed_deposit | other
  institution text,
  amount_invested numeric(15, 2) not null,
  current_value numeric(15, 2) not null,
  purchase_date date,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Welfare claims
create table if not exists public.welfare_claims (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade,
  claimant_id uuid references public.users(id) on delete cascade,
  type text not null,  -- medical | burial | graduation | maternity | other
  amount_requested numeric(15, 2) not null,
  amount_approved numeric(15, 2),
  status text not null default 'pending',  -- pending | approved | rejected | paid
  description text,
  document_url text,
  reviewed_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Announcements / community posts
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade,
  author_id uuid references public.users(id) on delete cascade,
  type text not null,  -- announcement | meeting | celebration | alert
  title text not null,
  content text,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  data jsonb,  -- extra context (group_id, loan_id, etc.)
  read boolean default false,
  created_at timestamptz default now()
);

-- Audit log
create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade,
  actor_id uuid references public.users(id),
  action text not null,  -- "approved_loan" | "recorded_contribution" | "changed_role" etc.
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- M-Pesa Transactions (Raw logs)
create table if not exists public.mpesa_transactions (
  id uuid primary key default uuid_generate_v4(),
  mpesa_code text unique not null,
  amount numeric(15, 2) not null,
  phone_number text not null,
  full_name text,
  transaction_type text, -- STKPush | C2B
  status text not null default 'pending', -- pending | matched | failed
  metadata jsonb,
  created_at timestamptz default now()
);

-- Row Level Security (RLS)

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.contributions enable row level security;
alter table public.loans enable row level security;
alter table public.loan_repayments enable row level security;
alter table public.investments enable row level security;
alter table public.welfare_claims enable row level security;
alter table public.posts enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.mpesa_transactions enable row level security;

-- Policies

-- Users: Anyone can view profiles, but only users can update their own
create policy "Public profiles are viewable by everyone" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Groups: Viewable by members
create policy "Groups are viewable by members" on public.groups
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = public.groups.id and user_id = auth.uid()
    )
  );

-- Group Members: Viewable by other members of the same group
create policy "Group members are viewable by co-members" on public.group_members
  for select using (
    exists (
      select 1 from public.group_members as gm
      where gm.group_id = public.group_members.group_id and gm.user_id = auth.uid()
    )
  );

-- Contributions: Members can view their own, admins/treasurers can view all in group
create policy "Members can view own contributions" on public.contributions
  for select using (user_id = auth.uid());

create policy "Treasurers can view all contributions in group" on public.contributions
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = public.contributions.group_id 
      and user_id = auth.uid() 
      and role in ('admin', 'treasurer')
    )
  );

-- Loans: Members can view own loans, admins/treasurers can view all in group
create policy "Members can view own loans" on public.loans
  for select using (borrower_id = auth.uid());

create policy "Treasurers can view all loans in group" on public.loans
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = public.loans.group_id 
      and user_id = auth.uid() 
      and role in ('admin', 'treasurer')
    )
  );

-- Investments: Viewable by all group members
create policy "Investments are viewable by group members" on public.investments
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = public.investments.group_id and user_id = auth.uid()
    )
  );

-- Posts: Viewable by all group members
create policy "Posts are viewable by group members" on public.posts
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = public.posts.group_id and user_id = auth.uid()
    )
  );

-- Notifications: Only viewable by the user
create policy "Notifications are viewable by the user" on public.notifications
  for select using (user_id = auth.uid());
