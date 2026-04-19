set search_path to public, auth;

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

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

create or replace view public.group_wallet_balances as
select
  g.id as group_id,
  coalesce(
    sum(
      case
        when l.direction = 'in' then l.amount
        when l.direction = 'out' then -l.amount
        else 0
      end
    ),
    0
  )::numeric(12, 2) as wallet_balance,
  coalesce(
    sum(case when l.type = 'contribution' then l.amount else 0 end),
    0
  )::numeric(12, 2) as total_contributions,
  coalesce(
    sum(case when l.type = 'join_fee' then l.amount else 0 end),
    0
  )::numeric(12, 2) as total_join_fees,
  max(l.created_at) as last_transaction_at
from public.groups g
left join public.group_ledger l on l.group_id = g.id and l.status = 'completed'
group by g.id;

create or replace view public.group_member_financials as
select
  gm.id as group_member_id,
  gm.group_id,
  gm.user_id,
  gm.role,
  gm.contribution_status,
  gm.accepted_terms,
  gm.join_fee_paid,
  gm.joined_at,
  coalesce(
    sum(case when gl.type = 'contribution' and gl.direction = 'in' then gl.amount else 0 end),
    0
  )::numeric(12, 2) as total_contributed
from public.group_members gm
left join public.group_ledger gl on gl.member_id = gm.id and gl.status = 'completed'
group by
  gm.id,
  gm.group_id,
  gm.user_id,
  gm.role,
  gm.contribution_status,
  gm.accepted_terms,
  gm.join_fee_paid,
  gm.joined_at;

create or replace view public.group_financial_summary as
select
  g.id as group_id,
  g.name,
  g.group_type,
  g.monthly_contribution,
  g.join_fee,
  g.next_contribution_date,
  count(distinct gm.id) as member_count,
  gw.wallet_balance,
  gw.total_contributions,
  gw.total_join_fees
from public.groups g
left join public.group_members gm on gm.group_id = g.id
left join public.group_wallet_balances gw on gw.group_id = g.id
group by
  g.id,
  g.name,
  g.group_type,
  g.monthly_contribution,
  g.join_fee,
  g.next_contribution_date,
  gw.wallet_balance,
  gw.total_contributions,
  gw.total_join_fees;
