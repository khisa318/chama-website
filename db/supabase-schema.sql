create extension if not exists pgcrypto;

set search_path to auth, public;

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
  description text,
  balance numeric(12, 2) not null default 0,
  monthly_contribution numeric(10, 2) not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id bigint generated always as identity primary key,
  group_id bigint not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'treasurer', 'member')),
  contribution_status text not null default 'pending' check (contribution_status in ('paid', 'pending', 'late')),
  total_contributed numeric(12, 2) not null default 0,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.contributions (
  id bigint generated always as identity primary key,
  group_id bigint not null references public.groups (id) on delete cascade,
  member_id bigint not null references public.group_members (id) on delete cascade,
  amount numeric(10, 2) not null,
  date timestamptz not null,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'bank_transfer', 'mobile_money', 'card')),
  notes text,
  status text not null default 'completed' check (status in ('completed', 'pending', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  group_id bigint not null references public.groups (id) on delete cascade,
  type text not null check (type in ('contribution', 'expense', 'loan', 'repayment')),
  amount numeric(10, 2) not null,
  description text,
  category text,
  date timestamptz not null,
  status text not null default 'completed' check (status in ('completed', 'pending', 'failed')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.loans (
  id bigint generated always as identity primary key,
  group_id bigint not null references public.groups (id) on delete cascade,
  requester_id bigint not null references public.group_members (id) on delete cascade,
  amount numeric(10, 2) not null,
  purpose text,
  repayment_period integer not null default 6,
  interest_rate numeric(5, 2) not null default 5,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'active', 'repaid')),
  remaining_balance numeric(10, 2),
  next_payment_date timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id bigint generated always as identity primary key,
  group_id bigint not null references public.groups (id) on delete cascade,
  description text not null,
  amount numeric(10, 2) not null,
  category text not null default 'other' check (category in ('food', 'events', 'emergency', 'business', 'transportation', 'other')),
  date timestamptz not null,
  receipt_url text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  group_id bigint references public.groups (id) on delete cascade,
  type text not null check (type in ('payment_reminder', 'contribution_received', 'loan_approved', 'loan_declined', 'group_announcement', 'member_joined', 'expense_recorded')),
  title text not null,
  message text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade,
  user_name text not null,
  user_avatar text,
  content text not null,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamptz not null default now()
);

create table if not exists public.group_messages (
  id bigint generated always as identity primary key,
  group_id bigint not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_name text not null,
  user_avatar text,
  content text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

do $$
declare
  admin_user uuid;
  family_group_id bigint;
  business_group_id bigint;
  first_member_id bigint;
begin
  select id into admin_user
  from auth.users
  order by created_at asc
  limit 1;

  insert into public.contacts (name, email, subject, message, status)
  values
    ('Jane Member', 'jane@example.com', 'Need help joining', 'Please help me join the family kitty.', 'new'),
    ('Musa Treasurer', 'musa@example.com', 'Loan rules', 'Can you explain the loan approval flow?', 'read')
  on conflict do nothing;

  insert into public.messages (user_name, content, likes)
  values
    ('Khisa Team', 'Welcome to the Khisa community forum.', 3),
    ('Savings Coach', 'Remember to log expenses the same day you spend them.', 1)
  on conflict do nothing;

  if admin_user is null then
    return;
  end if;

  insert into public.profiles (user_id, email, full_name, role, last_sign_in_at)
  values (
    admin_user,
    coalesce((select email from auth.users where id = admin_user), 'owner@example.com'),
    'Primary Admin',
    'admin',
    now()
  )
  on conflict (user_id) do update
  set role = excluded.role,
      full_name = excluded.full_name,
      email = excluded.email,
      last_sign_in_at = excluded.last_sign_in_at;

  insert into public.groups (name, description, balance, monthly_contribution, created_by)
  values ('Family Savings Circle', 'Monthly household savings and emergency support.', 4250.00, 250.00, admin_user)
  returning id into family_group_id;

  insert into public.groups (name, description, balance, monthly_contribution, created_by)
  values ('Business Growth Fund', 'Capital pool for inventory and small business expenses.', 9100.00, 500.00, admin_user)
  returning id into business_group_id;

  insert into public.group_members (group_id, user_id, role, contribution_status, total_contributed)
  values (family_group_id, admin_user, 'admin', 'paid', 1250.00)
  on conflict (group_id, user_id) do update
  set role = excluded.role,
      contribution_status = excluded.contribution_status,
      total_contributed = excluded.total_contributed
  returning id into first_member_id;

  insert into public.group_members (group_id, user_id, role, contribution_status, total_contributed)
  values (business_group_id, admin_user, 'admin', 'paid', 2500.00)
  on conflict (group_id, user_id) do nothing;

  insert into public.contributions (group_id, member_id, amount, date, payment_method, notes, status)
  values
    (family_group_id, first_member_id, 250.00, now() - interval '14 days', 'bank_transfer', 'Monthly contribution', 'completed'),
    (family_group_id, first_member_id, 300.00, now() - interval '3 days', 'mobile_money', 'Top-up contribution', 'completed');

  insert into public.expenses (group_id, description, amount, category, date, created_by)
  values
    (family_group_id, 'Emergency medical support', 150.00, 'emergency', now() - interval '5 days', admin_user),
    (business_group_id, 'Packaging supplies', 220.00, 'business', now() - interval '2 days', admin_user);

  insert into public.loans (group_id, requester_id, amount, purpose, repayment_period, interest_rate, status, remaining_balance, approved_by, approved_at, next_payment_date)
  values
    (family_group_id, first_member_id, 600.00, 'School fees advance', 6, 5.00, 'active', 450.00, admin_user, now() - interval '10 days', now() + interval '20 days'),
    (business_group_id, first_member_id, 1200.00, 'Bulk inventory purchase', 12, 5.00, 'pending', 1200.00, null, null, null);

  insert into public.transactions (group_id, type, amount, description, category, date, status, created_by)
  values
    (family_group_id, 'contribution', 250.00, 'Contribution via bank transfer', null, now() - interval '14 days', 'completed', admin_user),
    (family_group_id, 'contribution', 300.00, 'Contribution via mobile money', null, now() - interval '3 days', 'completed', admin_user),
    (family_group_id, 'expense', 150.00, 'Emergency medical support', 'emergency', now() - interval '5 days', 'completed', admin_user),
    (family_group_id, 'loan', 600.00, 'Loan approved: School fees advance', null, now() - interval '10 days', 'completed', admin_user),
    (business_group_id, 'expense', 220.00, 'Packaging supplies', 'business', now() - interval '2 days', 'completed', admin_user);

  insert into public.notifications (user_id, group_id, type, title, message, read)
  values
    (admin_user, family_group_id, 'contribution_received', 'Contribution received', 'Your latest family contribution was recorded successfully.', false),
    (admin_user, family_group_id, 'loan_approved', 'Loan approved', 'Your school fees loan is active and awaiting repayment.', false),
    (admin_user, business_group_id, 'expense_recorded', 'Expense recorded', 'Packaging supplies were recorded against the business fund.', true);
end
$$;
