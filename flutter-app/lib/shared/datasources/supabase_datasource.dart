import 'package:supabase_flutter/supabase_flutter.dart';

/// Base datasource for Supabase operations
/// This class provides a centralized way to interact with Supabase
class SupabaseDataSource {
  final SupabaseClient _client;

  SupabaseDataSource(this._client);

  /// Get the Supabase client
  SupabaseClient get client => _client;

  /// Get current authenticated user
  User? get currentUser => _client.auth.currentUser;

  /// Check if user is authenticated
  bool get isAuthenticated => _client.auth.currentUser != null;

  // ============ USERS ============

  /// Get user profile by ID
  Future<Map<String, dynamic>?> getUserById(String id) async {
    final result = await _client
        .from('users')
        .select()
        .eq('id', id)
        .maybeSingle();
    return result;
  }

  /// Get current user's profile
  Future<Map<String, dynamic>?> getCurrentUserProfile() async {
    final user = currentUser;
    if (user == null) return null;
    return getUserById(user.id);
  }

  /// Create or update user profile
  Future<void> upsertUserProfile({
    required String id,
    required String email,
    String? fullName,
    String? phone,
    String? avatarUrl,
  }) async {
    await _client.from('users').upsert({
      'id': id,
      'email': email,
      if (fullName != null) 'full_name': fullName,
      if (phone != null) 'phone': phone,
      if (avatarUrl != null) 'avatar_url': avatarUrl,
    });
  }

  /// Update user profile
  Future<void> updateUserProfile({
    required String id,
    String? fullName,
    String? phone,
    String? avatarUrl,
  }) async {
    await _client.from('users').update({
      if (fullName != null) 'full_name': fullName,
      if (phone != null) 'phone': phone,
      if (avatarUrl != null) 'avatar_url': avatarUrl,
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', id);
  }

  // ============ GROUPS ============

  /// List all groups the user is a member of
  Future<List<Map<String, dynamic>>> listMyGroups() async {
    final user = currentUser;
    if (user == null) return [];

    final members = await _client
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

    final groupIds = members.map((m) => m['group_id'] as String).toList();
    if (groupIds.isEmpty) return [];

    final groups = await _client
        .from('groups')
        .select()
        .inFilter('id', groupIds);

    return groups;
  }

  /// List public groups (for discovery)
  Future<List<Map<String, dynamic>>> listPublicGroups() async {
    final result = await _client
        .from('groups')
        .select()
        .limit(20);
    return result;
  }

  /// Get group by ID
  Future<Map<String, dynamic>?> getGroupById(String id) async {
    final result = await _client
        .from('groups')
        .select()
        .eq('id', id)
        .maybeSingle();
    return result;
  }

  /// Get group members
  Future<List<Map<String, dynamic>>> getGroupMembers(String groupId) async {
    final result = await _client
        .from('group_members')
        .select('*, users(*)')
        .eq('group_id', groupId);
    return result;
  }

  /// Create a new group
  Future<Map<String, dynamic>> createGroup({
    required String name,
    String? description,
    required String type,
    required num contributionAmount,
    required String contributionFrequency,
    int? contributionDay,
    num? loanInterestRate,
    num? maxLoanMultiplier,
    int? loanRepaymentMonths,
  }) async {
    final inviteCode = _generateInviteCode();

    final result = await _client.from('groups').insert({
      'name': name,
      'description': description,
      'type': type,
      'invite_code': inviteCode,
      'contribution_amount': contributionAmount,
      'contribution_frequency': contributionFrequency,
      'contribution_day': contributionDay ?? 1,
      'loan_interest_rate': loanInterestRate ?? 0,
      'max_loan_multiplier': maxLoanMultiplier ?? 3,
      'loan_repayment_months': loanRepaymentMonths ?? 12,
      'created_by': currentUser?.id,
    }).select().single();

    // Add creator as admin member
    await _client.from('group_members').insert({
      'group_id': result['id'],
      'user_id': currentUser?.id,
      'role': 'admin',
      'status': 'active',
    });

    return result;
  }

  /// Join a group by invite code
  Future<Map<String, dynamic>?> joinGroupByInviteCode(String inviteCode) async {
    final group = await _client
        .from('groups')
        .select()
        .eq('invite_code', inviteCode)
        .maybeSingle();

    if (group == null) return null;

    await _client.from('group_members').insert({
      'group_id': group['id'],
      'user_id': currentUser?.id,
      'role': 'member',
      'status': 'active',
    });

    return group;
  }

  /// Update a group
  Future<void> updateGroup({
    required String id,
    String? name,
    String? description,
    num? contributionAmount,
    String? contributionFrequency,
    int? contributionDay,
    num? loanInterestRate,
    num? maxLoanMultiplier,
    int? loanRepaymentMonths,
  }) async {
    await _client.from('groups').update({
      if (name != null) 'name': name,
      if (description != null) 'description': description,
      if (contributionAmount != null) 'contribution_amount': contributionAmount,
      if (contributionFrequency != null) 'contribution_frequency': contributionFrequency,
      if (contributionDay != null) 'contribution_day': contributionDay,
      if (loanInterestRate != null) 'loan_interest_rate': loanInterestRate,
      if (maxLoanMultiplier != null) 'max_loan_multiplier': maxLoanMultiplier,
      if (loanRepaymentMonths != null) 'loan_repayment_months': loanRepaymentMonths,
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', id);
  }

  /// Delete a group
  Future<void> deleteGroup(String id) async {
    await _client.from('groups').delete().eq('id', id);
  }

  // ============ CONTRIBUTIONS ============

  /// List contributions (optionally filtered)
  Future<List<Map<String, dynamic>>> listContributions({
    String? groupId,
    String? userId,
    String? status,
    String? monthYear,
  }) async {
    var query = _client.from('contributions').select();

    if (groupId != null) query = query.eq('group_id', groupId);
    if (userId != null) query = query.eq('user_id', userId);
    if (status != null) query = query.eq('status', status);
    if (monthYear != null) query = query.eq('month_year', monthYear);

    return query.order('created_at', ascending: false);
  }

  /// Get contribution by ID
  Future<Map<String, dynamic>?> getContributionById(String id) async {
    return await _client
        .from('contributions')
        .select()
        .eq('id', id)
        .maybeSingle();
  }

  /// Record a new contribution
  Future<Map<String, dynamic>> recordContribution({
    required String groupId,
    required String userId,
    required num amount,
    required String monthYear,
    required String paymentMethod,
    String? mpesaCode,
    String status = 'paid',
  }) async {
    final result = await _client.from('contributions').insert({
      'group_id': groupId,
      'user_id': userId,
      'amount': amount,
      'month_year': monthYear,
      'payment_method': paymentMethod,
      'mpesa_code': mpesaCode,
      'status': status,
      'recorded_by': currentUser?.id,
      'paid_at': status == 'paid' ? DateTime.now().toIso8601String() : null,
    }).select().single();

    // Audit log
    await _client.from('audit_log').insert({
      'group_id': groupId,
      'actor_id': currentUser?.id,
      'action': 'recorded_contribution',
      'target_type': 'contribution',
      'target_id': result['id'],
      'details': {'amount': amount, 'monthYear': monthYear},
    });

    return result;
  }

  /// Update contribution status
  Future<void> updateContributionStatus({
    required String id,
    required String status,
    String? mpesaCode,
  }) async {
    await _client.from('contributions').update({
      'status': status,
      'mpesa_code': mpesaCode,
      'paid_at': status == 'paid' ? DateTime.now().toIso8601String() : null,
    }).eq('id', id);
  }

  /// Get contribution summary for a group
  Future<Map<String, dynamic>> getContributionSummary({
    required String groupId,
    String? monthYear,
  }) async {
    final month = monthYear ?? DateTime.now().toIso8601String().substring(0, 7);

    final contributions = await _client
        .from('contributions')
        .select('amount, status')
        .eq('group_id', groupId)
        .eq('month_year', month);

    final totalPaid = contributions
        .where((c) => c['status'] == 'paid')
        .fold<num>(0, (sum, c) => sum + (c['amount'] as num));

    final totalPending = contributions
        .where((c) => c['status'] == 'pending')
        .fold<num>(0, (sum, c) => sum + (c['amount'] as num));

    return {
      'monthYear': month,
      'totalPaid': totalPaid,
      'totalPending': totalPending,
      'count': contributions.length,
    };
  }

  // ============ LOANS ============

  /// List loans (optionally filtered)
  Future<List<Map<String, dynamic>>> listLoans({
    String? groupId,
    String? borrowerId,
    String? status,
  }) async {
    var query = _client.from('loans').select();

    if (groupId != null) query = query.eq('group_id', groupId);
    if (borrowerId != null) query = query.eq('borrower_id', borrowerId);
    if (status != null) query = query.eq('status', status);

    return query.order('created_at', ascending: false);
  }

  /// Get loan by ID with repayments
  Future<Map<String, dynamic>?> getLoanById(String id) async {
    final loan = await _client
        .from('loans')
        .select()
        .eq('id', id)
        .maybeSingle();

    if (loan == null) return null;

    final repayments = await _client
        .from('loan_repayments')
        .select()
        .eq('loan_id', id)
        .order('month_number');

    return {...loan, 'repayments': repayments};
  }

  /// Request a loan
  Future<Map<String, dynamic>> requestLoan({
    required String groupId,
    required num amount,
    required int repaymentMonths,
    String? purpose,
  }) async {
    final group = await getGroupById(groupId);

    final result = await _client.from('loans').insert({
      'group_id': groupId,
      'borrower_id': currentUser?.id,
      'amount': amount,
      'interest_rate': group?['loan_interest_rate'] ?? 0,
      'repayment_months': repaymentMonths,
      'purpose': purpose,
      'status': 'pending',
    }).select().single();

    return result;
  }

  /// Approve a loan
  Future<void> approveLoan(String id) async {
    final loan = await getLoanById(id);
    if (loan == null) return;

    final now = DateTime.now();
    final repaymentMonths = loan['repayment_months'] as int;
    final principalPerMonth = (loan['amount'] as num) / repaymentMonths;
    final interestPerMonth =
        ((loan['amount'] as num) * ((loan['interest_rate'] as num) / 100)) / repaymentMonths;
    final totalDuePerMonth = principalPerMonth + interestPerMonth;

    // Generate repayment schedule
    final schedule = List.generate(repaymentMonths, (i) {
      final dueDate = DateTime(now.year, now.month + i + 1, 1);
      return {
        'loan_id': id,
        'month_number': i + 1,
        'due_date': dueDate.toIso8601String().substring(0, 10),
        'principal': principalPerMonth,
        'interest': interestPerMonth,
        'total_due': totalDuePerMonth,
        'status': 'pending',
      };
    });

    await _client.from('loan_repayments').insert(schedule);

    await _client.from('loans').update({
      'status': 'active',
      'approved_by': currentUser?.id,
      'disbursed_at': now.toIso8601String(),
    }).eq('id', id);

    // Audit log
    await _client.from('audit_log').insert({
      'group_id': loan['group_id'],
      'actor_id': currentUser?.id,
      'action': 'approved_loan',
      'target_type': 'loan',
      'target_id': id,
      'details': {'amount': loan['amount']},
    });
  }

  /// Reject a loan
  Future<void> rejectLoan(String id) async {
    await _client.from('loans').update({'status': 'rejected'}).eq('id', id);
  }

  /// Record a loan repayment
  Future<void> recordLoanRepayment({
    required String repaymentId,
    required num amount,
    String? mpesaCode,
  }) async {
    final repayment = await _client
        .from('loan_repayments')
        .select('*, loans(group_id)')
        .eq('id', repaymentId)
        .single();

    await _client.from('loan_repayments').update({
      'amount_paid': amount,
      'mpesa_code': mpesaCode,
      'status': amount >= (repayment['total_due'] as num) ? 'paid' : 'pending',
      'paid_at': DateTime.now().toIso8601String(),
    }).eq('id', repaymentId);

    // Audit log
    await _client.from('audit_log').insert({
      'group_id': repayment['loans']['group_id'],
      'actor_id': currentUser?.id,
      'action': 'recorded_repayment',
      'target_type': 'loan_repayment',
      'target_id': repaymentId,
      'details': {'amount': amount},
    });
  }

  // ============ WELFARE ============

  /// List welfare claims
  Future<List<Map<String, dynamic>>> listWelfareClaims({
    String? groupId,
    String? status,
  }) async {
    var query = _client.from('welfare_claims').select();

    if (groupId != null) query = query.eq('group_id', groupId);
    if (status != null) query = query.eq('status', status);

    return query.order('created_at', ascending: false);
  }

  /// Get welfare claim by ID
  Future<Map<String, dynamic>?> getWelfareClaimById(String id) async {
    return await _client
        .from('welfare_claims')
        .select()
        .eq('id', id)
        .maybeSingle();
  }

  /// Submit a welfare claim
  Future<Map<String, dynamic>> submitWelfareClaim({
    required String groupId,
    required String type,
    required String description,
    required num amountRequested,
    String? documentUrl,
  }) async {
    final result = await _client.from('welfare_claims').insert({
      'group_id': groupId,
      'claimant_id': currentUser?.id,
      'type': type,
      'description': description,
      'amount_requested': amountRequested,
      'document_url': documentUrl,
      'status': 'pending',
    }).select().single();

    // Audit log
    await _client.from('audit_log').insert({
      'group_id': groupId,
      'actor_id': currentUser?.id,
      'action': 'submitted_welfare_claim',
      'target_type': 'welfare_claim',
      'target_id': result['id'],
      'details': {'type': type, 'amount': amountRequested},
    });

    return result;
  }

  /// Review a welfare claim
  Future<void> reviewWelfareClaim({
    required String id,
    required String status,
    num? amountApproved,
  }) async {
    final claim = await getWelfareClaimById(id);

    await _client.from('welfare_claims').update({
      'status': status,
      'amount_approved': amountApproved,
      'reviewed_by': currentUser?.id,
      'reviewed_at': DateTime.now().toIso8601String(),
    }).eq('id', id);

    // Audit log
    await _client.from('audit_log').insert({
      'group_id': claim?['group_id'],
      'actor_id': currentUser?.id,
      'action': '${status}_welfare_claim',
      'target_type': 'welfare_claim',
      'target_id': id,
      'details': {'status': status, 'amountApproved': amountApproved},
    });
  }

  /// Mark welfare claim as paid
  Future<void> markWelfareClaimAsPaid(String id) async {
    await _client.from('welfare_claims').update({'status': 'paid'}).eq('id', id);
  }

  // ============ NOTIFICATIONS ============

  /// List notifications for current user
  Future<List<Map<String, dynamic>>> listNotifications({bool? read}) async {
    var query = _client
        .from('notifications')
        .select()
        .eq('user_id', currentUser?.id)
        .order('created_at', ascending: false)
        .limit(50);

    if (read != null) query = query.eq('read', read);

    return query;
  }

  /// Get unread notification count
  Future<int> getUnreadNotificationCount() async {
    final result = await _client
        .from('notifications')
        .select('id')
        .eq('user_id', currentUser?.id)
        .eq('read', false);

    return result.length;
  }

  /// Mark notification as read
  Future<void> markNotificationAsRead(String id) async {
    await _client.from('notifications').update({'read': true}).eq('id', id);
  }

  /// Mark all notifications as read
  Future<void> markAllNotificationsAsRead() async {
    await _client
        .from('notifications')
        .update({'read': true})
        .eq('user_id', currentUser?.id)
        .eq('read', false);
  }

  /// Delete a notification
  Future<void> deleteNotification(String id) async {
    await _client.from('notifications').delete().eq('id', id);
  }

  // ============ CHAT ============

  /// List chat messages for a group
  Future<List<Map<String, dynamic>>> listChatMessages(String groupId) async {
    return await _client
        .from('chat_messages')
        .select('*, users(*)')
        .eq('group_id', groupId)
        .order('created_at', ascending: true);
  }

  /// Send a chat message
  Future<Map<String, dynamic>> sendChatMessage({
    required String groupId,
    required String content,
  }) async {
    return await _client.from('chat_messages').insert({
      'group_id': groupId,
      'user_id': currentUser?.id,
      'content': content,
    }).select().single();
  }

  // ============ INVESTMENTS ============

  /// List investments for a group
  Future<List<Map<String, dynamic>>> listInvestments(String? groupId) async {
    var query = _client.from('investments').select();

    if (groupId != null) query = query.eq('group_id', groupId);

    return query.order('created_at', ascending: false);
  }

  /// Add an investment
  Future<Map<String, dynamic>> addInvestment({
    required String groupId,
    required String name,
    required String type,
    String? institution,
    required num amountInvested,
    String? purchaseDate,
    String? notes,
  }) async {
    return await _client.from('investments').insert({
      'group_id': groupId,
      'name': name,
      'type': type,
      'institution': institution,
      'amount_invested': amountInvested,
      'current_value': amountInvested,
      'purchase_date': purchaseDate,
      'notes': notes,
      'created_by': currentUser?.id,
    }).select().single();
  }

  /// Update investment current value
  Future<void> updateInvestmentValue({
    required String id,
    required num currentValue,
  }) async {
    await _client.from('investments').update({
      'current_value': currentValue,
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', id);
  }

  // ============ AUDIT LOG ============

  /// List audit logs for a group
  Future<List<Map<String, dynamic>>> listAuditLogs({
    required String groupId,
    int limit = 50,
  }) async {
    return await _client
        .from('audit_log')
        .select()
        .eq('group_id', groupId)
        .order('created_at', ascending: false)
        .limit(limit);
  }

  // ============ HELPERS ============

  String _generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = DateTime.now().millisecondsSinceEpoch;
    return List.generate(6, (index) => chars[(random + index) % chars.length]).join();
  }
}
