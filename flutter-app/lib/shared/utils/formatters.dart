import 'package:intl/intl.dart';

/// Format a number as currency (KSh)
String formatCurrency(num amount) {
  final formatter = NumberFormat.currency(
    symbol: 'KSh ',
    decimalDigits: 2,
  );
  return formatter.format(amount);
}

/// Format a date string
String formatDate(String? dateString) {
  if (dateString == null) return '';
  try {
    final date = DateTime.parse(dateString);
    return DateFormat('dd MMM yyyy').format(date);
  } catch (_) {
    return dateString;
  }
}

/// Format a datetime string
String formatDateTime(String? dateString) {
  if (dateString == null) return '';
  try {
    final date = DateTime.parse(dateString);
    return DateFormat('dd MMM yyyy HH:mm').format(date);
  } catch (_) {
    return dateString;
  }
}

/// Format relative time (e.g., "2 hours ago")
String formatRelativeTime(String? dateString) {
  if (dateString == null) return '';
  try {
    final date = DateTime.parse(dateString);
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 7) {
      return DateFormat('dd MMM yyyy').format(date);
    } else if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} min${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  } catch (_) {
    return dateString;
  }
}

/// Get current month/year in "YYYY-MM" format
String getCurrentMonthYear() {
  return DateFormat('yyyy-MM').format(DateTime.now());
}

/// Parse month/year string to DateTime
DateTime parseMonthYear(String monthYear) {
  return DateFormat('yyyy-MM').parse('$monthYear-01');
}
