import 'package:flutter/widgets.dart';

import 'gen/app_localizations.dart';

export 'gen/app_localizations.dart';

extension L10nContext on BuildContext {
  /// `context.l10n.loginTitle` — the strings for the active locale.
  AppLocalizations get l10n => AppLocalizations.of(this);
}

/// Access for code that has no BuildContext: the API client wording a
/// network failure, the location service explaining a refused permission.
/// Kept in step with the UI by LocaleController.
class L10n {
  L10n._();

  static String code = 'fr';

  static const supported = [Locale('fr'), Locale('ar')];

  static AppLocalizations get current => lookupAppLocalizations(Locale(code));

  static bool get isRtl => code == 'ar';
}

/// A money amount in the active language: "16 MAD" / "16 د.م.".
String mad(BuildContext context, num amount, {int decimals = 0}) =>
    context.l10n.amountMad(amount.toStringAsFixed(decimals));

/// A signed amount — "+8 MAD", "−16.00 د.م.". The sign is isolated together
/// with the digits: written next to them in a template, Arabic text would
/// push it to the far side ("8+").
String signedMad(BuildContext context, num amount, {required String sign, int decimals = 0}) =>
    context.l10n.amountMad(isolate('$sign${amount.toStringAsFixed(decimals)}'));

/// Wraps a left-to-right value (a plate like 1234-A-70) in Unicode
/// first-strong isolates before it goes into a translated sentence. Inside
/// Arabic text the bidi algorithm would otherwise reorder its parts.
String isolate(String? value) => '$_fsi${value ?? ''}$_pdi';

// FIRST STRONG ISOLATE and POP DIRECTIONAL ISOLATE, built from code points so
// no invisible character sits in the source.
final _fsi = String.fromCharCode(0x2068);
final _pdi = String.fromCharCode(0x2069);
