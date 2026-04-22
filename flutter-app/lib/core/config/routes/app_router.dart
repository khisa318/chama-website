import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/auth/presentation/pages/forgot_password_page.dart';
import '../../features/groups/presentation/pages/groups_list_page.dart';
import '../../features/groups/presentation/pages/group_detail_page.dart';
import '../../features/groups/presentation/pages/create_group_page.dart';
import '../../features/groups/presentation/pages/join_group_page.dart';
import '../../features/contributions/presentation/pages/contributions_page.dart';
import '../../features/loans/presentation/pages/loans_page.dart';
import '../../features/loans/presentation/pages/loan_detail_page.dart';
import '../../features/loans/presentation/pages/apply_loan_page.dart';
import '../../features/welfare/presentation/pages/welfare_page.dart';
import '../../features/welfare/presentation/pages/submit_claim_page.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';
import '../../features/chat/presentation/pages/chat_page.dart';
import '../../shared/widgets/app_shell.dart';
import '../../features/settings/presentation/pages/settings_page.dart';

/// Route paths
class Routes {
  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String groups = '/groups';
  static const String createGroup = '/groups/create';
  static const String joinGroup = '/groups/join';
  static const String groupDetail = '/groups/:id';
  static const String contributions = '/contributions';
  static const String loans = '/loans';
  static const String loanDetail = '/loans/:id';
  static const String applyLoan = '/loans/apply';
  static const String welfare = '/welfare';
  static const String submitClaim = '/welfare/submit';
  static const String notifications = '/notifications';
  static const String chat = '/chat';
  static const String settings = '/settings';
}

/// App router configuration using go_router
class AppRouter {
  static GoRouter createRouter() {
    return GoRouter(
      initialLocation: Routes.login,
      debugLogDiagnostics: true,
      routes: [
        // Auth routes (no shell)
        GoRoute(
          path: Routes.login,
          builder: (context, state) => const LoginPage(),
        ),
        GoRoute(
          path: Routes.register,
          builder: (context, state) => const RegisterPage(),
        ),
        GoRoute(
          path: Routes.forgotPassword,
          builder: (context, state) => const ForgotPasswordPage(),
        ),

        // Protected routes (with shell - bottom nav)
        ShellRoute(
          builder: (context, state, child) => AppShell(child: child),
          routes: [
            GoRoute(
              path: Routes.groups,
              builder: (context, state) => const GroupsListPage(),
              routes: [
                GoRoute(
                  path: 'create',
                  builder: (context, state) => const CreateGroupPage(),
                ),
                GoRoute(
                  path: 'join',
                  builder: (context, state) => const JoinGroupPage(),
                ),
                GoRoute(
                  path: ':id',
                  builder: (context, state) => GroupDetailPage(
                    groupId: state.pathParameters['id']!,
                  ),
                ),
              ],
            ),
            GoRoute(
              path: Routes.contributions,
              builder: (context, state) {
                final groupId = state.uri.queryParameters['groupId'];
                return ContributionsPage(groupId: groupId);
              },
            ),
            GoRoute(
              path: Routes.loans,
              builder: (context, state) {
                final groupId = state.uri.queryParameters['groupId'];
                return LoansPage(groupId: groupId);
              },
              routes: [
                GoRoute(
                  path: 'apply',
                  builder: (context, state) {
                    final groupId = state.uri.queryParameters['groupId'];
                    return ApplyLoanPage(groupId: groupId);
                  },
                ),
                GoRoute(
                  path: ':id',
                  builder: (context, state) => LoanDetailPage(
                    loanId: state.pathParameters['id']!,
                  ),
                ),
              ],
            ),
            GoRoute(
              path: Routes.welfare,
              builder: (context, state) {
                final groupId = state.uri.queryParameters['groupId'];
                return WelfarePage(groupId: groupId);
              },
              routes: [
                GoRoute(
                  path: 'submit',
                  builder: (context, state) {
                    final groupId = state.uri.queryParameters['groupId'];
                    return SubmitClaimPage(groupId: groupId);
                  },
                ),
              ],
            ),
            GoRoute(
              path: Routes.notifications,
              builder: (context, state) => const NotificationsPage(),
            ),
            GoRoute(
              path: Routes.chat,
              builder: (context, state) {
                final groupId = state.uri.queryParameters['groupId'];
                return ChatPage(groupId: groupId);
              },
            ),
            GoRoute(
              path: Routes.settings,
              builder: (context, state) => const SettingsPage(),
            ),
          ],
        ),
      ],
      errorBuilder: (context, state) => Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                'Page not found',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(state.uri.toString()),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => context.go(Routes.groups),
                child: const Text('Go to Groups'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}