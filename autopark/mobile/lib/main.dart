import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';
// intl has its own TextDirection; the widgets need Flutter's.
import 'package:intl/intl.dart' hide TextDirection;
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/app_router.dart';
import 'core/auth_provider.dart';
import 'core/locale_controller.dart';
import 'core/realtime_service.dart';
import 'core/theme_controller.dart';
import 'design/app_theme.dart';
import 'l10n/l10n.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // DateFormat(..., locale) throws unless the locale data is loaded first.
  await initializeDateFormatting('fr');
  await initializeDateFormatting('ar');
  // Moroccan Arabic writes Latin digits — on receipts, plates and signage.
  // intl's 'ar' would otherwise render times as ١٨:٣٠.
  DateFormat.useNativeDigitsByDefaultFor('ar', false);

  final locale = await LocaleController.load();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ThemeController()),
        ChangeNotifierProvider.value(value: locale),
        ChangeNotifierProvider(create: (_) => RealtimeService()),
      ],
      child: const AutoParkApp(),
    ),
  );
}

class AutoParkApp extends StatefulWidget {
  const AutoParkApp({super.key});

  @override
  State<AutoParkApp> createState() => _AutoParkAppState();
}

class _AutoParkAppState extends State<AutoParkApp> {
  // Built exactly once. Rebuilding the router inside build() threw away the
  // navigation stack on every auth notification; redirects stay live through
  // the router's own refreshListenable instead.
  late final GoRouter _router = AppRouter.router(context.read<AuthProvider>());

  @override
  Widget build(BuildContext context) {
    final themeMode = context.watch<ThemeController>().mode;
    final locale = context.watch<LocaleController>().locale;

    return MaterialApp.router(
      onGenerateTitle: (context) => context.l10n.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      // The locale drives Directionality: Arabic flips the tree to RTL.
      // The Material delegates also localize the date and time pickers,
      // which otherwise render in English with 12-hour AM/PM.
      locale: locale,
      supportedLocales: L10n.supported,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: _router,
    );
  }
}
