import 'package:autopark_mobile/design/app_theme.dart';
import 'package:autopark_mobile/l10n/l10n.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

/// Wraps a widget the way the app does: real theme, real translations, and
/// the locale's text direction (Arabic flips the tree to RTL).
Widget harness(Widget child, {Locale locale = const Locale('fr'), bool dark = false}) {
  return MaterialApp(
    theme: dark ? AppTheme.dark : AppTheme.light,
    locale: locale,
    supportedLocales: L10n.supported,
    localizationsDelegates: const [
      AppLocalizations.delegate,
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
      GlobalCupertinoLocalizations.delegate,
    ],
    home: Scaffold(body: child),
  );
}
