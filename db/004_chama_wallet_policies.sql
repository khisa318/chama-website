set search_path to public, auth;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_ledger enable row level security;
alter table public.group_loans enable row level security;
alter table public.group_messages enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "groups_select_public_or_member" on public.groups;
create policy "groups_select_public_or_member"
on public.groups
for select
to authenticated
using (
  true
);

drop policy if exists "groups_insert_creator" on public.groups;
create policy "groups_insert_creator"
on public.groups
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "groups_update_admin_only" on public.groups;
create policy "groups_update_admin_only"
on public.groups
for update
to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  )
);

drop policy if exists "group_members_select_members" on public.group_members;
create policy "group_members_select_members"
on public.group_members
for select
to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.groups g
    where g.id = group_members.group_id
      and g.member_list_visibility = 'public'
  )
);

drop policy if exists "group_members_join_self" on public.group_members;
create policy "group_members_join_self"
on public.group_members
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "group_members_update_self_or_admin" on public.group_members;
create policy "group_members_update_self_or_admin"
on public.group_members
for update
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  )
)
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  )
);

drop policy if exists "group_ledger_select_members" on public.group_ledger;
create policy "group_ledger_select_members"
on public.group_ledger
for select
to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_ledger.group_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "group_ledger_insert_member_or_admin" on public.group_ledger;
create policy "group_ledger_insert_member_or_admin"
on public.group_ledger
for insert
to authenticated
with check (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_ledger.group_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "group_loans_select_members" on public.group_loans;
create policy "group_loans_select_members"
on public.group_loans
for select
to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_loans.group_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "group_loans_insert_members" on public.group_loans;
create policy "group_loans_insert_members"
on public.group_loans
for insert
to authenticated
with check (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_loans.group_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "group_loans_update_admin_only" on public.group_loans;
create policy "group_loans_update_admin_only"
on public.group_loans
for update
to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_loans.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_loans.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  )
);

drop policy if exists "group_messages_select_members" on public.group_messages;
create policy "group_messages_select_members"
on public.group_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_messages.group_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "group_messages_insert_members" on public.group_messages;
create policy "group_messages_insert_members"
on public.group_messages
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_messages.group_id
      and gm.user_id = auth.uid()
  )
);
