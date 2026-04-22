import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/config/supabase_config.dart';
import 'core/config/routes/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/groups/presentation/bloc/groups_bloc.dart';
import 'features/contributions/presentation/bloc/contributions_bloc.dart';
import 'features/loans/presentation/bloc/loans_bloc.dart';
import 'features/welfare/presentation/bloc/welfare_bloc.dart';
import 'features/notifications/presentation/bloc/notifications_bloc.dart';
import 'shared/datasources/supabase_datasource.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await SupabaseConfig.initialize();

  runApp(const ChamaApp());
}

class ChamaApp extends StatelessWidget {
  const ChamaApp({super.key});

  @override
  Widget build(BuildContext context) {
    final supabaseDataSource = SupabaseDataSource(Supabase.instance.client);

    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<SupabaseDataSource>.value(value: supabaseDataSource),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider<AuthBloc>(
            create: (context) => AuthBloc(supabaseDataSource),
          ),
          BlocProvider<GroupsBloc>(
            create: (context) => GroupsBloc(supabaseDataSource),
          ),
          BlocProvider<ContributionsBloc>(
            create: (context) => ContributionsBloc(supabaseDataSource),
          ),
          BlocProvider<LoansBloc>(
            create: (context) => LoansBloc(supabaseDataSource),
          ),
          BlocProvider<WelfareBloc>(
            create: (context) => WelfareBloc(supabaseDataSource),
          ),
          BlocProvider<NotificationsBloc>(
            create: (context) => NotificationsBloc(supabaseDataSource),
          ),
        ],
        child: MaterialApp.router(
          title: 'Chama Wallet',
          theme: AppTheme.lightTheme,
          routerConfig: AppRouter.createRouter(),
          debugShowCheckedModeBanner: false,
        ),
      ),
    );
  }
}
