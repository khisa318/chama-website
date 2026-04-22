/// App-wide constants
class AppConstants {
  // App info
  static const String appName = 'Chama Wallet';
  static const String appVersion = '1.0.0';

  // Supabase table names
  static const String usersTable = 'users';
  static const String groupsTable = 'groups';
  static const String groupMembersTable = 'group_members';
  static const String contributionsTable = 'contributions';
  static const String loansTable = 'loans';
  static const String loanRepaymentsTable = 'loan_repayments';
  static const String investmentsTable = 'investments';
  static const String welfareClaimsTable = 'welfare_claims';
  static const String postsTable = 'posts';
  static const String notificationsTable = 'notifications';
  static const String auditLogTable = 'audit_log';
  static const String mpesaTransactionsTable = 'mpesa_transactions';
  static const String eventsTable = 'events';
  static const String chatMessagesTable = 'chat_messages';

  // Group types
  static const List<String> groupTypes = [
    'savings',
    'table_banking',
    'investment',
    'welfare',
    'sacco',
  ];

  // Group type display names
  static const Map<String, String> groupTypeNames = {
    'savings': 'Savings Group',
    'table_banking': 'Table Banking',
    'investment': 'Investment Group',
    'welfare': 'Welfare Group',
    'sacco': 'SACCO',
  };

  // Contribution frequencies
  static const List<String> contributionFrequencies = [
    'weekly',
    'monthly',
    'custom',
  ];

  // Payment methods
  static const List<String> paymentMethods = [
    'mpesa',
    'cash',
    'bank',
  ];

  // Payment method display names
  static const Map<String, String> paymentMethodNames = {
    'mpesa': 'M-Pesa',
    'cash': 'Cash',
    'bank': 'Bank Transfer',
  };

  // Loan statuses
  static const List<String> loanStatuses = [
    'pending',
    'active',
    'paid',
    'defaulted',
    'rejected',
  ];

  // Contribution statuses
  static const List<String> contributionStatuses = [
    'paid',
    'pending',
    'overdue',
  ];

  // Welfare claim types
  static const List<String> welfareClaimTypes = [
    'medical',
    'burial',
    'graduation',
    'maternity',
    'emergency',
    'other',
  ];

  // Welfare claim type display names
  static const Map<String, String> welfareClaimTypeNames = {
    'medical': 'Medical',
    'burial': 'Burial',
    'graduation': 'Graduation',
    'maternity': 'Maternity',
    'emergency': 'Emergency',
    'other': 'Other',
  };

  // Investment types
  static const List<String> investmentTypes = [
    'unit_trust',
    'shares',
    'property',
    'fixed_deposit',
    'other',
  ];

  // Expense categories
  static const List<String> expenseCategories = [
    'food',
    'events',
    'emergency',
    'business',
    'transportation',
    'other',
  ];

  // Event types
  static const List<String> eventTypes = [
    'meeting',
    'announcement',
    'celebration',
    'training',
  ];

  // Date formats
  static const String dateFormat = 'yyyy-MM-dd';
  static const String dateTimeFormat = 'yyyy-MM-dd HH:mm:ss';
  static const String displayDateFormat = 'dd MMM yyyy';
  static const String displayDateTimeFormat = 'dd MMM yyyy HH:mm';

  // Currency
  static const String currencySymbol = 'KSh ';
  static const int currencyDecimalPlaces = 2;
}