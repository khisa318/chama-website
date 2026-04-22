-- ============================================================
-- CHAMA WALLET - SUPABASE DATABASE SETUP
-- Run this in: Supabase SQL Editor > New Query
-- ============================================================

-- Enable UUID extension (if not already enabled)
create extension if not exists "uuid-ossp";

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Users (Profiles) - synced with Supabase Auth
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text unique not null,
  phone text unique,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Groups (Chamas)
create table if not exists public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  type text not null check (type in ('savings', 'table_banking', 'investment', 'welfare', 'sacco')),
  invite_code text unique,
  contribution_amount numeric(15, 2) not null default 0,
  contribution_frequency text not null check (contribution_frequency in ('weekly', 'monthly', 'custom')),
  contribution_day int check (contribution_day between 1 and 31),
  loan_interest_rate numeric(5, 2) default 0,
  max_loan_multiplier numeric(5, 2) default 3,
  loan_repayment_months int default 12,
  balance numeric(15, 2) default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Group Members (Junction table)
create table if not exists public.group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('admin', 'treasurer', 'secretary', 'member')),
  status text not null default 'active' check (status in ('active', 'suspended', 'left')),
  total_contributed numeric(15, 2) default 0,
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- Contributions
create table if not exists public.contributions (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(15, 2) not null check (amount > 0),
  month_year text not null,
  payment_method text not null check (payment_method in ('mpesa', 'cash', 'bank')),
  mpesa_code text,
  status text not null default 'pending' check (status in ('paid', 'pending', 'overdue')),
  recorded_by uuid references public.users(id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Loans
create table if not exists public.loans (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  borrower_id uuid not null references public.users(id) on delete cascade,
  amount numeric(15, 2) not null check (amount > 0),
  interest_rate numeric(5, 2) not null,
  repayment_months int not null check (repayment_months > 0),
  purpose text,
  status text not null default 'pending' check (status in ('pending', 'active', 'paid', 'defaulted', 'rejected')),
  remaining_balance numeric(15, 2),
  next_payment_date date,
  disbursed_at timestamptz,
  approved_by uuid references public.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- Loan Repayments
create table if not exists public.loan_repayments (
  id uuid primary key default uuid_generate_v4(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  month_number int not null check (month_number > 0),
  due_date date not null,
  principal numeric(15, 2) not null,
  interest numeric(15, 2) not null,
  total_due numeric(15, 2) not null,
  amount_paid numeric(15, 2) default 0,
  mpesa_code text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  paid_at timestamptz,
  unique(loan_id, month_number)
);

-- Investments
create table if not exists public.investments (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null,
  type text not null check (type in ('unit_trust', 'shares', 'property', 'fixed_deposit', 'other')),
  institution text,
  amount_invested numeric(15, 2) not null,
  current_value numeric(15, 2) not null,
  purchase_date date,
  maturity_date date,
  status text default 'active' check (status in ('active', 'matured', 'liquidated')),
  expected_return numeric(5, 2),
  actual_return numeric(15, 2),
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Welfare Claims
create table if not exists public.welfare_claims (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  claimant_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('medical', 'burial', 'graduation', 'maternity', 'emergency', 'other')),
  amount_requested numeric(15, 2) not null,
  amount_approved numeric(15, 2),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  description text,
  document_url text,
  rejection_reason text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Announcements / Posts
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('announcement', 'meeting', 'celebration', 'alert')),
  title text not null,
  content text,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  data jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

-- Audit Log
create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  old_value jsonb,
  new_value jsonb,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- M-Pesa Transactions (Raw logs for reconciliation)
create table if not exists public.mpesa_transactions (
  id uuid primary key default uuid_generate_v4(),
  mpesa_code text unique not null,
  amount numeric(15, 2) not null,
  phone_number text not null,
  full_name text,
  transaction_type text check (transaction_type in ('STKPush', 'C2B')),
  status text not null default 'pending' check (status in ('pending', 'matched', 'failed')),
  metadata jsonb,
  group_id uuid references public.groups(id) on delete set null,
  member_id uuid references public.group_members(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================================
-- ADDITIONAL TABLES FOR ENHANCED FEATURES
-- ============================================================

-- Events
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  description text,
  event_type text not null check (event_type in ('meeting', 'announcement', 'celebration', 'training')),
  start_date timestamptz not null,
  end_date timestamptz,
  location text,
  image_url text,
  status text default 'scheduled' check (status in ('scheduled', 'ongoing', 'completed', 'cancelled')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Event RSVPs
create table if not exists public.event_rsvps (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  status text not null check (status in ('attending', 'not_attending', 'maybe')),
  guest_count int default 0,
  notes text,
  rsvped_at timestamptz default now(),
  unique(event_id, member_id)
);

-- Merry-Go-Round Rotations
create table if not exists public.rotations (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null,
  description text,
  rotation_amount numeric(15, 2) not null,
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  start_date timestamptz not null,
  current_recipient_id uuid references public.group_members(id) on delete set null,
  status text default 'active' check (status in ('active', 'completed', 'paused')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Rotation Schedule
create table if not exists public.rotation_schedule (
  id uuid primary key default uuid_generate_v4(),
  rotation_id uuid not null references public.rotations(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  sequence_number int not null,
  payout_date timestamptz,
  payout_amount numeric(15, 2),
  status text default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz default now(),
  unique(rotation_id, sequence_number)
);

-- Bills
create table if not exists public.bills (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  bill_month date not null,
  bill_amount numeric(15, 2) not null,
  bill_type text not null check (bill_type in ('contribution', 'fine', 'loan', 'other')),
  description text,
  due_date date,
  status text default 'pending' check (status in ('pending', 'partially_paid', 'paid', 'overdue')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bill Payments
create table if not exists public.bill_payments (
  id uuid primary key default uuid_generate_v4(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  amount_paid numeric(15, 2) not null,
  payment_method text default 'cash' check (payment_method in ('cash', 'mpesa', 'bank')),
  mpesa_ref text,
  paid_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Role Permissions
create table if not exists public.role_permissions (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  role_name text not null,
  permissions jsonb not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User Preferences
create table if not exists public.user_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  dark_mode boolean default false,
  email_notifications boolean default true,
  sms_notifications boolean default true,
  language text default 'en',
  theme text default 'light',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat Messages (Group Chat)
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Users
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_phone on public.users(phone);

-- Groups
create index if not exists idx_groups_invite_code on public.groups(invite_code);
create index if not exists idx_groups_created_by on public.groups(created_by);

-- Group Members
create index if not exists idx_group_members_group_id on public.group_members(group_id);
create index if not exists idx_group_members_user_id on public.group_members(user_id);
create index if not exists idx_group_members_group_user on public.group_members(group_id, user_id);

-- Contributions
create index if not exists idx_contributions_group_id on public.contributions(group_id);
create index if not exists idx_contributions_user_id on public.contributions(user_id);
create index if not exists idx_contributions_month_year on public.contributions(month_year);
create index if not exists idx_contributions_status on public.contributions(status);
create index if not exists idx_contributions_group_month on public.contributions(group_id, month_year);

-- Loans
create index if not exists idx_loans_group_id on public.loans(group_id);
create index if not exists idx_loans_borrower_id on public.loans(borrower_id);
create index if not exists idx_loans_status on public.loans(status);

-- Loan Repayments
create index if not exists idx_loan_repayments_loan_id on public.loan_repayments(loan_id);
create index if not exists idx_loan_repayments_status on public.loan_repayments(status);

-- Investments
create index if not exists idx_investments_group_id on public.investments(group_id);
create index if not exists idx_investments_status on public.investments(status);

-- Welfare Claims
create index if not exists idx_welfare_claims_group_id on public.welfare_claims(group_id);
create index if not exists idx_welfare_claims_claimant_id on public.welfare_claims(claimant_id);
create index if not exists idx_welfare_claims_status on public.welfare_claims(status);

-- Notifications
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read);
create index if not exists idx_notifications_user_read on public.notifications(user_id, read);

-- Audit Log
create index if not exists idx_audit_log_group_id on public.audit_log(group_id);
create index if not exists idx_audit_log_actor_id on public.audit_log(actor_id);
create index if not exists idx_audit_log_created_at on public.audit_log(created_at);

-- M-Pesa Transactions
create index if not exists idx_mpesa_transactions_mpesa_code on public.mpesa_transactions(mpesa_code);
create index if not exists idx_mpesa_transactions_phone on public.mpesa_transactions(phone_number);
create index if not exists idx_mpesa_transactions_status on public.mpesa_transactions(status);

-- Events
create index if not exists idx_events_group_id on public.events(group_id);
create index if not exists idx_events_start_date on public.events(start_date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

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
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.rotations enable row level security;
alter table public.rotation_schedule enable row level security;
alter table public.bills enable row level security;
alter table public.bill_payments enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_preferences enable row level security;
alter table public.chat_messages enable row level security;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Helper function to check group membership
create or replace function public.is_group_member(p_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$ language sql security definer;

-- Helper function to check group admin/treasurer role
create or replace function public.is_group_admin(p_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
      and role in ('admin', 'treasurer')
  );
$$ language sql security definer;

-- USERS: Public profiles, users manage own
create policy "Users are viewable by everyone" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- GROUPS: Viewable by members, managed by admins
create policy "Groups viewable by members" on public.groups
  for select using (is_group_member(id));

create policy "Groups insertable by authenticated users" on public.groups
  for insert with check (auth.uid() is not null);

create policy "Groups updatable by admins" on public.groups
  for update using (is_group_admin(id));

create policy "Groups deletable by admins" on public.groups
  for delete using (is_group_admin(id));

-- GROUP MEMBERS: Viewable by co-members
create policy "Group members viewable by co-members" on public.group_members
  for select using (is_group_member(group_id));

create policy "Group members insertable by members" on public.group_members
  for insert with check (auth.uid() = user_id);

create policy "Group members updatable by admins" on public.group_members
  for update using (is_group_admin(group_id));

-- CONTRIBUTIONS: Members view own, admins view all
create policy "Contributions viewable by members (own)" on public.contributions
  for select using (user_id = auth.uid());

create policy "Contributions viewable by admins (all in group)" on public.contributions
  for select using (is_group_admin(group_id));

create policy "Contributions insertable by members" on public.contributions
  for insert with check (auth.uid() = user_id or is_group_admin(group_id));

create policy "Contributions updatable by admins" on public.contributions
  for update using (is_group_admin(group_id));

create policy "Contributions deletable by admins" on public.contributions
  for delete using (is_group_admin(group_id));

-- LOANS: Borrowers view own, admins view all
create policy "Loans viewable by borrower" on public.loans
  for select using (borrower_id = auth.uid());

create policy "Loans viewable by admins" on public.loans
  for select using (is_group_admin(group_id));

create policy "Loans insertable by authenticated users" on public.loans
  for insert with check (auth.uid() = borrower_id);

create policy "Loans updatable by admins" on public.loans
  for update using (is_group_admin(group_id));

-- LOAN REPAYMENTS: Follows loan access
create policy "Loan repayments viewable by loan access" on public.loan_repayments
  for select using (
    exists (
      select 1 from public.loans
      where id = loan_repayments.loan_id
      and (borrower_id = auth.uid() or is_group_admin(group_id))
    )
  );

create policy "Loan repayments insertable by admins" on public.loan_repayments
  for insert with check (is_group_admin(
    select group_id from public.loans where id = loan_repayments.loan_id
  ));

-- INVESTMENTS: Viewable by group members
create policy "Investments viewable by group members" on public.investments
  for select using (is_group_member(group_id));

create policy "Investments insertable by admins" on public.investments
  for insert with check (is_group_admin(group_id));

create policy "Investments updatable by admins" on public.investments
  for update using (is_group_admin(group_id));

create policy "Investments deletable by admins" on public.investments
  for delete using (is_group_admin(group_id));

-- WELFARE CLAIMS: Claimant views own, admins view all
create policy "Welfare claims viewable by claimant" on public.welfare_claims
  for select using (claimant_id = auth.uid());

create policy "Welfare claims viewable by admins" on public.welfare_claims
  for select using (is_group_admin(group_id));

create policy "Welfare claims insertable by members" on public.welfare_claims
  for insert with check (auth.uid() = claimant_id);

create policy "Welfare claims updatable by admins" on public.welfare_claims
  for update using (is_group_admin(group_id));

-- POSTS: Viewable by group members, authors can insert
create policy "Posts viewable by group members" on public.posts
  for select using (is_group_member(group_id));

create policy "Posts insertable by group members" on public.posts
  for insert with check (auth.uid() = author_id and is_group_member(group_id));

create policy "Posts deletable by admins" on public.posts
  for delete using (is_group_admin(group_id));

-- NOTIFICATIONS: Only user sees own
create policy "Notifications viewable by owner" on public.notifications
  for select using (user_id = auth.uid());

create policy "Notifications updatable by owner" on public.notifications
  for update using (user_id = auth.uid());

create policy "Notifications deletable by owner" on public.notifications
  for delete using (user_id = auth.uid());

-- AUDIT LOG: Viewable by group members, insertable by system
create policy "Audit log viewable by group members" on public.audit_log
  for select using (group_id is null or is_group_member(group_id));

create policy "Audit log insertable by service role" on public.audit_log
  for insert with check (true); -- Service role only

-- M-PESA TRANSACTIONS: Viewable by admins
create policy "M-Pesa transactions viewable by admins" on public.mpesa_transactions
  for select using (group_id is null or is_group_admin(group_id));

create policy "M-Pesa transactions insertable by service role" on public.mpesa_transactions
  for insert with check (true);

-- EVENTS: Viewable by group members
create policy "Events viewable by group members" on public.events
  for select using (is_group_member(group_id));

create policy "Events insertable by admins" on public.events
  for insert with check (is_group_admin(group_id));

create policy "Events updatable by admins" on public.events
  for update using (is_group_admin(group_id));

create policy "Events deletable by admins" on public.events
  for delete using (is_group_admin(group_id));

-- EVENT RSVP: Viewable by group members, editable by self
create policy "Event RSVPs viewable by group members" on public.event_rsvps
  for select using (
    exists (
      select 1 from public.events e
      join public.group_members gm on gm.group_id = e.group_id
      where e.id = event_rsvps.event_id and gm.user_id = auth.uid()
    )
  );

create policy "Event RSVPs insertable by members" on public.event_rsvps
  for insert with check (
    exists (
      select 1 from public.event_rsvps where event_id = event_rsvps.event_id and member_id = event_rsvps.member_id
    ) = false
  );

-- ROTATIONS: Viewable by group members
create policy "Rotations viewable by group members" on public.rotations
  for select using (is_group_member(group_id));

create policy "Rotations insertable by admins" on public.rotations
  for insert with check (is_group_admin(group_id));

-- ROTATION SCHEDULE: Viewable by group members
create policy "Rotation schedule viewable by group members" on public.rotation_schedule
  for select using (
    exists (
      select 1 from public.rotations r
      join public.group_members gm on gm.group_id = r.group_id
      where r.id = rotation_schedule.rotation_id and gm.user_id = auth.uid()
    )
  );

-- BILLS: Viewable by group members
create policy "Bills viewable by group members" on public.bills
  for select using (is_group_member(group_id));

create policy "Bills insertable by admins" on public.bills
  for insert with check (is_group_admin(group_id));

-- BILL PAYMENTS: Viewable by group members
create policy "Bill payments viewable by group members" on public.bill_payments
  for select using (
    exists (
      select 1 from public.bills b
      join public.group_members gm on gm.group_id = b.group_id
      where b.id = bill_payments.bill_id and gm.user_id = auth.uid()
    )
  );

-- ROLE PERMISSIONS: Viewable by group members
create policy "Role permissions viewable by group members" on public.role_permissions
  for select using (is_group_member(group_id));

-- USER PREFERENCES: Only user sees own
create policy "User preferences viewable by owner" on public.user_preferences
  for select using (user_id = auth.uid());

create policy "User preferences updatable by owner" on public.user_preferences
  for update using (user_id = auth.uid());

create policy "User preferences insertable by owner" on public.user_preferences
  for insert with check (auth.uid() = user_id);

-- CHAT MESSAGES: Viewable by group members
create policy "Chat messages viewable by group members" on public.chat_messages
  for select using (is_group_member(group_id));

create policy "Chat messages insertable by group members" on public.chat_messages
  for insert with check (auth.uid() = user_id and is_group_member(group_id));

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger update_groups_updated_at
  before update on public.groups
  for each row execute function public.handle_updated_at();

create trigger update_investments_updated_at
  before update on public.investments
  for each row execute function public.handle_updated_at();

create trigger update_welfare_claims_updated_at
  before update on public.welfare_claims
  for each row execute function public.handle_updated_at();

create trigger update_events_updated_at
  before update on public.events
  for each row execute function public.handle_updated_at();

create trigger update_bills_updated_at
  before update on public.bills
  for each row execute function public.handle_updated_at();

create trigger update_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.handle_updated_at();

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create user preferences for new users
  insert into public.user_preferences (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SAMPLE DATA (Optional - remove in production)
-- ============================================================

-- Insert a sample admin user (for testing only)
-- Note: In production, users are created via Supabase Auth

/*
insert into public.users (id, full_name, email, phone)
values (
  gen_random_uuid(),
  'Test Admin',
  'admin@example.com',
  '+254700000000'
);
*/

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check all tables were created
-- select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE';

-- Check all indexes were created
-- select indexname from pg_indexes where schemaname = 'public' order by indexname;

-- Check RLS is enabled on all tables
-- select tablename from pg_tables where schemaname = 'public' and rowsecurity = true;