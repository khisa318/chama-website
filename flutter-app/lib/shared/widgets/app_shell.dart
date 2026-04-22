import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/routes/app_router.dart';

/// Bottom navigation bar items
enum NavItem {
  groups(
    icon: Icons.groups_outlined,
    selectedIcon: Icons.groups,
    label: 'Chamas',
  ),
  contributions(
    icon: Icons.account_balance_wallet_outlined,
    selectedIcon: Icons.account_balance_wallet,
    label: 'Contributions',
  ),
  loans(
    icon: Icons.money_outlined,
    selectedIcon: Icons.money,
    label: 'Loans',
  ),
  welfare(
    icon: Icons.favorite_outline,
    selectedIcon: Icons.favorite,
    label: 'Welfare',
  ),
  more(
    icon: Icons.more_horiz,
    selectedIcon: Icons.more_horiz,
    label: 'More',
  );

  const NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });
}

/// Shell widget that provides bottom navigation for protected routes
class AppShell extends StatelessWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: _BottomNavBar(),
    );
  }
}

class _BottomNavBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;

    return NavigationBar(
      selectedIndex: _getSelectedIndex(location),
      onDestinationSelected: (index) => _onItemTapped(context, index),
      destinations: NavItem.values.map((item) {
        return NavigationDestination(
          icon: Icon(item.icon),
          selectedIcon: Icon(item.selectedIcon),
          label: item.label,
        );
      }).toList(),
    );
  }

  int _getSelectedIndex(String location) {
    if (location.startsWith('/groups')) return 0;
    if (location.startsWith('/contributions')) return 1;
    if (location.startsWith('/loans')) return 2;
    if (location.startsWith('/welfare')) return 3;
    return 4; // More (notifications, chat, settings)
  }

  void _onItemTapped(BuildContext context, int index) {
    final item = NavItem.values[index];
    switch (item) {
      case NavItem.groups:
        context.go(Routes.groups);
        break;
      case NavItem.contributions:
        context.go(Routes.contributions);
        break;
      case NavItem.loans:
        context.go(Routes.loans);
        break;
      case NavItem.welfare:
        context.go(Routes.welfare);
        break;
      case NavItem.more:
        _showMoreMenu(context);
        break;
    }
  }

  void _showMoreMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.notifications_outlined),
              title: const Text('Notifications'),
              onTap: () {
                Navigator.pop(context);
                context.push(Routes.notifications);
              },
            ),
            ListTile(
              leading: const Icon(Icons.chat_outlined),
              title: const Text('Chat'),
              onTap: () {
                Navigator.pop(context);
                context.push(Routes.chat);
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined),
              title: const Text('Settings'),
              onTap: () {
                Navigator.pop(context);
                context.push(Routes.settings);
              },
            ),
          ],
        ),
      ),
    );
  }
}
