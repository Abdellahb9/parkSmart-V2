import 'package:flutter/material.dart';
// intl has its own TextDirection; the widgets need Flutter's.
import 'package:intl/intl.dart' hide TextDirection;
import 'package:shared_preferences/shared_preferences.dart';

import '../l10n/l10n.dart';

/// French or Arabic, persisted between launches.
///
/// Switching rebuilds MaterialApp with the new locale, which is what flips
/// the whole widget tree to right-to-left — every padding and alignment in
/// the app is already direction-relative, so nothing else has to change.
class LocaleController extends ChangeNotifier {
  static const _key = 'app_locale';

  Locale _locale = const Locale('fr');
  Locale get locale => _locale;
  String get code => _locale.languageCode;

  /// Reads the saved choice before the first frame, so an Arabic user never
  /// sees the app flash in French.
  static Future<LocaleController> load() async {
    final controller = LocaleController();
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_key);
      if (saved == 'ar' || saved == 'fr') controller._apply(saved!);
    } catch (_) {
      // Default to French; a missing preference is not an error.
    }
    return controller;
  }

  void _apply(String code) {
    _locale = Locale(code);
    L10n.code = code;
    Intl.defaultLocale = code;
  }

  Future<void> set(String code) async {
    if (code == this.code || !(code == 'fr' || code == 'ar')) return;
    _apply(code);
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, code);
    } catch (_) {
      // The choice lasts for this session only.
    }
  }
}
