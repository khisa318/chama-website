import 'package:supabase_flutter/supabase_flutter.dart';

/// Environment variables - replace with your actual Supabase credentials
class Env {
  static const String supabaseUrl = 'YOUR_SUPABASE_URL';
  static const String supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
}

/// Supabase configuration and initialization
class SupabaseConfig {
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: Env.supabaseUrl,
      anonKey: Env.supabaseAnonKey,
    );
  }

  static SupabaseClient get client => Supabase.instance.client;

  /// Get the current authenticated user
  static User? get currentUser => client.auth.currentUser;

  /// Check if user is authenticated
  static bool get isAuthenticated => client.auth.currentUser != null;

  /// Stream of auth state changes
  static Stream<User?> get authStateChanges => client.auth.onAuthStateChange.map(
        (event) => event.session?.user,
      );
}