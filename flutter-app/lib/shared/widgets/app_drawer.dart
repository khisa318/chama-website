import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/config/routes/app_router.dart';
import '../../core/theme/app_theme.dart';

/// App drawer for navigation
class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            // Header with user info
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: AppColors.primary,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: Colors.white24,
                    child: Text(
                      user?.email?.substring(0, 1).toUpperCase() ?? 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.email ?? 'User',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

            // Navigation items
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _DrawerItem(
                    icon: Icons.groups,
                    label: 'My Chamas',
                    onTap: () => context.go(Routes.groups),
                  ),
                  _DrawerItem(
                    icon: Icons.account_balance_wallet,
                    label: 'Contributions',
                    onTap: () => context.go(Routes.contributions),
                  ),
                  _DrawerItem(
                    icon: Icons.money,
                    label: 'Loans',
                    onTap: () => context.go(Routes.loans),
                  ),
                  _DrawerItem(
                    icon: Icons.favorite,
                    label: 'Welfare',
                    onTap: () => context.go(Routes.welfare),
                  ),
                  const Divider(),
                  _DrawerItem(
                    icon: Icons.notifications,
                    label: 'Notifications',
                    onTap: () => context.push(Routes.notifications),
                  ),
                  _DrawerItem(
                    icon: Icons.chat,
                    label: 'Chat',
                    onTap: () => context.push(Routes.chat),
                  ),
                  const Divider(),
                  _DrawerItem(
                    icon: Icons.settings,
                    label: 'Settings',
                    onTap: () => context.push(Routes.settings),
                  ),
                ],
              ),
            ),

            // Logout button
            Padding(
              padding: const EdgeInsets.all(16),
              child: OutlinedButton.icon(
                onPressed: () async {
                  await Supabase.instance.client.auth.signOut();
                  if (context.mounted) {
                    context.go(Routes.login);
                  }
                },
                icon: const Icon(Icons.logout),
                label: const Text('Logout'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textSecondary),
      title: Text(
        label,
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: onTap,
    );
  }
}
