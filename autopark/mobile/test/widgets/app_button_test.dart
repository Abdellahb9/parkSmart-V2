import 'package:autopark_mobile/widgets/widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/harness.dart';

void main() {
  testWidgets('a tap calls onPressed', (tester) async {
    var taps = 0;
    await tester.pumpWidget(harness(AppButton(label: 'Confirmer la réservation', onPressed: () => taps++)));
    await tester.tap(find.text('Confirmer la réservation'));
    expect(taps, 1);
  });

  testWidgets('while loading it shows progress and ignores taps (no double booking)', (tester) async {
    var taps = 0;
    await tester.pumpWidget(harness(AppButton(label: 'Payer 16 MAD', loading: true, onPressed: () => taps++)));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    await tester.tap(find.text('Payer 16 MAD'), warnIfMissed: false);
    await tester.tap(find.text('Payer 16 MAD'), warnIfMissed: false);
    expect(taps, 0);
  });

  testWidgets('without onPressed it is disabled', (tester) async {
    await tester.pumpWidget(harness(const AppButton(label: 'Continuer')));
    await tester.tap(find.text('Continuer'), warnIfMissed: false);
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });

  testWidgets('every variant renders in light and dark', (tester) async {
    for (final dark in [false, true]) {
      await tester.pumpWidget(harness(
        Column(
          children: [
            for (final variant in AppButtonVariant.values)
              AppButton(label: variant.name, variant: variant, icon: Icons.check, onPressed: () {}),
          ],
        ),
        dark: dark,
      ));
      for (final variant in AppButtonVariant.values) {
        expect(find.text(variant.name), findsOneWidget);
      }
    }
  });
}
