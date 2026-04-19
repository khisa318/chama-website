set search_path to public, auth;

create unique index if not exists groups_join_code_key
  on public.groups (join_code)
  where join_code is not null;

do $$
declare
  admin_user uuid;
  admin_email text;
  second_user uuid;
  second_email text;
  third_user uuid;
  third_email text;
  savings_group_id bigint;
  investment_group_id bigint;
  welfare_group_id bigint;
  savings_member_id bigint;
  investment_member_id bigint;
  welfare_member_id bigint;
  second_savings_member_id bigint;
  second_investment_member_id bigint;
  third_welfare_member_id bigint;
begin
  select id, email
    into admin_user, admin_email
  from auth.users
  order by created_at asc
  limit 1;

  select id, email
    into second_user, second_email
  from auth.users
  order by created_at asc
  offset 1
  limit 1;

  select id, email
    into third_user, third_email
  from auth.users
  order by created_at asc
  offset 2
  limit 1;

  if admin_user is null then
    raise notice 'Seed skipped: create at least one auth user first, then rerun this script.';
    return;
  end if;

  delete from public.group_messages
  where group_id in (
    select id
    from public.groups
    where join_code in ('FSC250', 'BGF500', 'CWC300')
  );

  delete from public.group_loans
  where group_id in (
    select id
    from public.groups
    where join_code in ('FSC250', 'BGF500', 'CWC300')
  );

  delete from public.group_ledger
  where group_id in (
    select id
    from public.groups
    where join_code in ('FSC250', 'BGF500', 'CWC300')
  );

  delete from public.group_members
  where group_id in (
    select id
    from public.groups
    where join_code in ('FSC250', 'BGF500', 'CWC300')
  );

  delete from public.groups
  where join_code in ('FSC250', 'BGF500', 'CWC300');

  insert into public.profiles (user_id, email, full_name, role, last_sign_in_at)
  values (
    admin_user,
    coalesce(admin_email, 'owner@example.com'),
    'Primary Admin',
    'admin',
    now()
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    last_sign_in_at = excluded.last_sign_in_at;

  if second_user is not null then
    insert into public.profiles (user_id, email, full_name, role, last_sign_in_at)
    values (
      second_user,
      coalesce(second_email, 'member.two@example.com'),
      'Demo Member Two',
      'user',
      now()
    )
    on conflict (user_id) do update
    set
      email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      last_sign_in_at = excluded.last_sign_in_at;
  end if;

  if third_user is not null then
    insert into public.profiles (user_id, email, full_name, role, last_sign_in_at)
    values (
      third_user,
      coalesce(third_email, 'member.three@example.com'),
      'Demo Member Three',
      'user',
      now()
    )
    on conflict (user_id) do update
    set
      email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      last_sign_in_at = excluded.last_sign_in_at;
  end if;

  insert into public.groups (
    name,
    group_type,
    description,
    monthly_contribution,
    max_members,
    join_code,
    join_fee,
    meeting_day,
    payout_style,
    next_contribution_date,
    wallet_transparency,
    member_list_visibility,
    profile_image_url,
    created_by
  )
  values
    (
      'Family Savings Circle',
      'savings',
      'Monthly household savings and emergency support.',
      250.00,
      20,
      'FSC250',
      150.00,
      'First Saturday',
      'Rotational payout',
      now() + interval '10 days',
      true,
      'members-only',
      null,
      admin_user
    )
  on conflict (join_code) do update
  set
    name = excluded.name,
    group_type = excluded.group_type,
    description = excluded.description,
    monthly_contribution = excluded.monthly_contribution,
    meeting_day = excluded.meeting_day,
    payout_style = excluded.payout_style,
    next_contribution_date = excluded.next_contribution_date
  returning id into savings_group_id;

  insert into public.groups (
    name,
    group_type,
    description,
    monthly_contribution,
    max_members,
    join_code,
    join_fee,
    meeting_day,
    payout_style,
    next_contribution_date,
    wallet_transparency,
    member_list_visibility,
    profile_image_url,
    created_by
  )
  values
    (
      'Business Growth Fund',
      'investment',
      'Capital pool for inventory and small business expenses.',
      500.00,
      15,
      'BGF500',
      150.00,
      'Second Sunday',
      'Quarterly investment pool',
      now() + interval '14 days',
      true,
      'members-only',
      null,
      admin_user
    )
  on conflict (join_code) do update
  set
    name = excluded.name,
    group_type = excluded.group_type,
    description = excluded.description,
    monthly_contribution = excluded.monthly_contribution,
    meeting_day = excluded.meeting_day,
    payout_style = excluded.payout_style,
    next_contribution_date = excluded.next_contribution_date
  returning id into investment_group_id;

  insert into public.groups (
    name,
    group_type,
    description,
    monthly_contribution,
    max_members,
    join_code,
    join_fee,
    meeting_day,
    payout_style,
    next_contribution_date,
    wallet_transparency,
    member_list_visibility,
    profile_image_url,
    created_by
  )
  values
    (
      'Care Welfare Circle',
      'welfare',
      'Support pool for hospital bills, bereavement, and emergencies.',
      300.00,
      30,
      'CWC300',
      150.00,
      'Last Friday',
      'Emergency-first allocation',
      now() + interval '7 days',
      true,
      'members-only',
      null,
      admin_user
    )
  on conflict (join_code) do update
  set
    name = excluded.name,
    group_type = excluded.group_type,
    description = excluded.description,
    monthly_contribution = excluded.monthly_contribution,
    meeting_day = excluded.meeting_day,
    payout_style = excluded.payout_style,
    next_contribution_date = excluded.next_contribution_date
  returning id into welfare_group_id;

  insert into public.group_members (
    group_id,
    user_id,
    role,
    contribution_status,
    total_contributed,
    accepted_terms,
    join_fee_paid
  )
  values
    (savings_group_id, admin_user, 'admin', 'on-track', 1250.00, true, true)
  on conflict (group_id, user_id) do update
  set
    role = excluded.role,
    contribution_status = excluded.contribution_status,
    total_contributed = excluded.total_contributed,
    accepted_terms = excluded.accepted_terms,
    join_fee_paid = excluded.join_fee_paid
  returning id into savings_member_id;

  insert into public.group_members (
    group_id,
    user_id,
    role,
    contribution_status,
    total_contributed,
    accepted_terms,
    join_fee_paid
  )
  values
    (investment_group_id, admin_user, 'admin', 'on-track', 2500.00, true, true)
  on conflict (group_id, user_id) do update
  set
    role = excluded.role,
    contribution_status = excluded.contribution_status,
    total_contributed = excluded.total_contributed,
    accepted_terms = excluded.accepted_terms,
    join_fee_paid = excluded.join_fee_paid
  returning id into investment_member_id;

  insert into public.group_members (
    group_id,
    user_id,
    role,
    contribution_status,
    total_contributed,
    accepted_terms,
    join_fee_paid
  )
  values
    (welfare_group_id, admin_user, 'admin', 'on-track', 900.00, true, true)
  on conflict (group_id, user_id) do update
  set
    role = excluded.role,
    contribution_status = excluded.contribution_status,
    total_contributed = excluded.total_contributed,
    accepted_terms = excluded.accepted_terms,
    join_fee_paid = excluded.join_fee_paid
  returning id into welfare_member_id;

  if second_user is not null then
    insert into public.group_members (
      group_id,
      user_id,
      role,
      contribution_status,
      total_contributed,
      accepted_terms,
      join_fee_paid
    )
    values
      (savings_group_id, second_user, 'member', 'on-track', 500.00, true, true)
    on conflict (group_id, user_id) do update
    set
      role = excluded.role,
      contribution_status = excluded.contribution_status,
      total_contributed = excluded.total_contributed,
      accepted_terms = excluded.accepted_terms,
      join_fee_paid = excluded.join_fee_paid
    returning id into second_savings_member_id;

    insert into public.group_members (
      group_id,
      user_id,
      role,
      contribution_status,
      total_contributed,
      accepted_terms,
      join_fee_paid
    )
    values
      (investment_group_id, second_user, 'member', 'pending', 500.00, true, true)
    on conflict (group_id, user_id) do update
    set
      role = excluded.role,
      contribution_status = excluded.contribution_status,
      total_contributed = excluded.total_contributed,
      accepted_terms = excluded.accepted_terms,
      join_fee_paid = excluded.join_fee_paid
    returning id into second_investment_member_id;
  end if;

  if third_user is not null then
    insert into public.group_members (
      group_id,
      user_id,
      role,
      contribution_status,
      total_contributed,
      accepted_terms,
      join_fee_paid
    )
    values
      (welfare_group_id, third_user, 'member', 'on-track', 300.00, true, true)
    on conflict (group_id, user_id) do update
    set
      role = excluded.role,
      contribution_status = excluded.contribution_status,
      total_contributed = excluded.total_contributed,
      accepted_terms = excluded.accepted_terms,
      join_fee_paid = excluded.join_fee_paid
    returning id into third_welfare_member_id;
  end if;

  insert into public.group_ledger (
    group_id,
    member_id,
    type,
    direction,
    amount,
    payment_method,
    note,
    reference,
    status,
    created_by,
    created_at
  )
  values
    (savings_group_id, savings_member_id, 'join_fee', 'in', 150.00, 'mpesa', 'Joining fee paid', 'MPESA-JOIN-001', 'completed', admin_user, now() - interval '40 days'),
    (savings_group_id, savings_member_id, 'contribution', 'in', 250.00, 'mpesa', 'Monthly contribution', 'MPESA-CONTRIB-001', 'completed', admin_user, now() - interval '30 days'),
    (savings_group_id, savings_member_id, 'contribution', 'in', 250.00, 'mpesa', 'Monthly contribution', 'MPESA-CONTRIB-002', 'completed', admin_user, now() - interval '5 days'),
    (savings_group_id, savings_member_id, 'withdrawal', 'out', 150.00, 'mpesa', 'Emergency support paid out', 'MPESA-WITHDRAW-001', 'completed', admin_user, now() - interval '3 days'),

    (investment_group_id, investment_member_id, 'join_fee', 'in', 150.00, 'mpesa', 'Joining fee paid', 'MPESA-JOIN-002', 'completed', admin_user, now() - interval '50 days'),
    (investment_group_id, investment_member_id, 'contribution', 'in', 500.00, 'bank', 'Capital contribution', 'BANK-CONTRIB-001', 'completed', admin_user, now() - interval '28 days'),
    (investment_group_id, investment_member_id, 'contribution', 'in', 500.00, 'bank', 'Capital contribution', 'BANK-CONTRIB-002', 'completed', admin_user, now() - interval '8 days'),
    (investment_group_id, investment_member_id, 'withdrawal', 'out', 300.00, 'bank', 'Inventory purchase payout', 'BANK-WITHDRAW-001', 'completed', admin_user, now() - interval '2 days'),

    (welfare_group_id, welfare_member_id, 'join_fee', 'in', 150.00, 'mpesa', 'Joining fee paid', 'MPESA-JOIN-003', 'completed', admin_user, now() - interval '20 days'),
    (welfare_group_id, welfare_member_id, 'contribution', 'in', 300.00, 'mpesa', 'Welfare contribution', 'MPESA-CONTRIB-003', 'completed', admin_user, now() - interval '12 days'),
    (welfare_group_id, welfare_member_id, 'withdrawal', 'out', 100.00, 'mpesa', 'Hospital emergency support', 'MPESA-WITHDRAW-002', 'completed', admin_user, now() - interval '1 day')
  ;

  if second_user is not null then
    insert into public.group_ledger (
      group_id,
      member_id,
      type,
      direction,
      amount,
      payment_method,
      note,
      reference,
      status,
      created_by,
      created_at
    )
    values
      (savings_group_id, second_savings_member_id, 'join_fee', 'in', 150.00, 'mpesa', 'Joining fee paid', 'MPESA-JOIN-004', 'completed', second_user, now() - interval '35 days'),
      (savings_group_id, second_savings_member_id, 'contribution', 'in', 250.00, 'mpesa', 'Monthly contribution', 'MPESA-CONTRIB-004', 'completed', second_user, now() - interval '18 days'),
      (investment_group_id, second_investment_member_id, 'join_fee', 'in', 150.00, 'mpesa', 'Joining fee paid', 'MPESA-JOIN-005', 'completed', second_user, now() - interval '32 days'),
      (investment_group_id, second_investment_member_id, 'contribution', 'in', 500.00, 'bank', 'Capital contribution', 'BANK-CONTRIB-003', 'completed', second_user, now() - interval '10 days');
  end if;

  if third_user is not null then
    insert into public.group_ledger (
      group_id,
      member_id,
      type,
      direction,
      amount,
      payment_method,
      note,
      reference,
      status,
      created_by,
      created_at
    )
    values
      (welfare_group_id, third_welfare_member_id, 'join_fee', 'in', 150.00, 'mpesa', 'Joining fee paid', 'MPESA-JOIN-006', 'completed', third_user, now() - interval '16 days'),
      (welfare_group_id, third_welfare_member_id, 'contribution', 'in', 300.00, 'mpesa', 'Welfare contribution', 'MPESA-CONTRIB-005', 'completed', third_user, now() - interval '4 days');
  end if;

  insert into public.group_loans (
    group_id,
    member_id,
    amount,
    purpose,
    interest_rate,
    repayment_period,
    status,
    remaining_balance,
    approved_by,
    approved_at,
    next_payment_date
  )
  values
    (savings_group_id, savings_member_id, 600.00, 'School fees advance', 5.00, 6, 'active', 450.00, admin_user, now() - interval '10 days', now() + interval '20 days'),
    (investment_group_id, investment_member_id, 1200.00, 'Inventory financing', 8.00, 4, 'pending', 1200.00, null, null, null),
    (welfare_group_id, welfare_member_id, 300.00, 'Emergency support', 0.00, 1, 'approved', 300.00, admin_user, now() - interval '2 days', now() + interval '14 days')
  ;

  insert into public.group_messages (
    group_id,
    user_id,
    user_name,
    user_avatar,
    user_role,
    content,
    created_at
  )
  values
    (savings_group_id, admin_user, 'Primary Admin', null, 'admin', 'Welcome to the Family Savings Circle wallet.', now() - interval '4 days'),
    (savings_group_id, admin_user, 'Primary Admin', null, 'admin', 'Remember the next contribution date is coming up soon.', now() - interval '1 day'),
    (investment_group_id, admin_user, 'Primary Admin', null, 'admin', 'Business Growth Fund is ready for new capital contributions.', now() - interval '2 days'),
    (welfare_group_id, admin_user, 'Primary Admin', null, 'admin', 'Care Welfare Circle is set for emergency support tracking.', now() - interval '12 hours')
  ;

  if second_user is not null then
    insert into public.group_messages (
      group_id,
      user_id,
      user_name,
      user_avatar,
      user_role,
      content,
      created_at
    )
    values
      (savings_group_id, second_user, 'Demo Member Two', null, 'member', 'I have completed this month''s savings contribution.', now() - interval '16 hours'),
      (investment_group_id, second_user, 'Demo Member Two', null, 'member', 'Can we review the next business purchase in the upcoming meeting?', now() - interval '6 hours');
  end if;

  if third_user is not null then
    insert into public.group_messages (
      group_id,
      user_id,
      user_name,
      user_avatar,
      user_role,
      content,
      created_at
    )
    values
      (welfare_group_id, third_user, 'Demo Member Three', null, 'member', 'Thank you for the emergency support workflow update.', now() - interval '3 hours');
  end if;

  raise notice 'Chama wallet seed complete. First auth user is admin. Create a second and third auth user to unlock fuller member demo data.';
end
$$;
