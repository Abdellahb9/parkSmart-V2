import 'dart:convert';
import 'dart:io';

import 'package:autopark_mobile/l10n/l10n.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

/// The French and Arabic catalogues must stay in step: a key missing in one
/// language, or a placeholder renamed in only one, shows up here rather than
/// as a broken sentence on a phone.
void main() {
  Map<String, dynamic> arb(String lang) =>
      jsonDecode(File('lib/l10n/app_$lang.arb').readAsStringSync()) as Map<String, dynamic>;

  final fr = arb('fr');
  final ar = arb('ar');
  bool isMessage(String key) => !key.startsWith('@');

  // {name} references and plural/select variables.
  Set<String> placeholders(String text) => {
        ...RegExp(r'\{(\w+)\}').allMatches(text).map((m) => m[1]!),
        ...RegExp(r'\{(\w+),\s*(?:plural|select)').allMatches(text).map((m) => m[1]!),
      };

  test('every French message exists in Arabic, and the reverse', () {
    final frKeys = fr.keys.where(isMessage).toSet();
    final arKeys = ar.keys.where(isMessage).toSet();
    expect(frKeys.difference(arKeys), isEmpty, reason: 'missing in Arabic');
    expect(arKeys.difference(frKeys), isEmpty, reason: 'missing in French');
  });

  test('placeholders match between languages', () {
    for (final key in fr.keys.where(isMessage)) {
      expect(
        placeholders(ar[key] as String),
        placeholders(fr[key] as String),
        reason: 'placeholders differ for "$key"',
      );
    }
  });

  test('no message is blank', () {
    for (final entry in [...fr.entries, ...ar.entries].where((e) => isMessage(e.key))) {
      expect((entry.value as String).trim(), isNotEmpty, reason: entry.key);
    }
  });

  group('Arabic plurals use all six CLDR forms', () {
    final l = lookupAppLocalizations(const Locale('ar'));
    final cases = {
      0: 'لا مكان شاغر',
      1: 'مكان شاغر واحد',
      2: 'مكانان شاغران',
      3: '3 أماكن شاغرة',
      11: '11 مكانًا شاغرًا',
      100: '100 مكان شاغر',
    };
    cases.forEach((count, expected) {
      test('$count', () => expect(l.bookingFreeOf(count, 20), startsWith(expected)));
    });
  });

  test('French plurals', () {
    final l = lookupAppLocalizations(const Locale('fr'));
    expect(l.bookingFreeOf(1, 20), '1 place libre sur 20');
    expect(l.bookingFreeOf(16, 20), '16 places libres sur 20');
  });

  test('isolate() wraps left-to-right values for Arabic sentences', () {
    final wrapped = isolate('12345-A-61');
    expect(wrapped.codeUnitAt(0), 0x2068);
    expect(wrapped.codeUnitAt(wrapped.length - 1), 0x2069);
    expect(wrapped.substring(1, wrapped.length - 1), '12345-A-61');
    expect(isolate(null).length, 2);
  });
}
