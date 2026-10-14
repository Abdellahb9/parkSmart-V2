import 'package:autopark_mobile/l10n/l10n.dart';
import 'package:autopark_mobile/widgets/widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/harness.dart';

/// Every data screen goes through AsyncView, so these four states are the
/// guarantee that no screen is ever a blank page: loading shows a skeleton,
/// a failure is distinguishable from "nothing here" and offers a retry.
void main() {
  final fr = lookupAppLocalizations(const Locale('fr'));
  final ar = lookupAppLocalizations(const Locale('ar'));

  Widget view({
    bool loading = false,
    Object? error,
    bool isEmpty = false,
    VoidCallback? onRetry,
    Widget? emptyAction,
  }) =>
      AsyncView(
        loading: loading,
        error: error,
        isEmpty: isEmpty,
        onRetry: onRetry,
        errorTitle: 'Impossible de charger vos réservations',
        emptyTitle: 'Aucune réservation',
        emptyMessage: 'Réservez une place depuis la carte.',
        emptyAction: emptyAction,
        builder: (_) => const Text('Parking Al Massira'),
      );

  testWidgets('loading shows skeletons, not content', (tester) async {
    await tester.pumpWidget(harness(view(loading: true)));
    // The skeleton pulses forever: pump once instead of pumpAndSettle.
    await tester.pump();
    expect(find.byType(SkeletonList), findsOneWidget);
    expect(find.text('Parking Al Massira'), findsNothing);
  });

  testWidgets('an error is shown as an error, with its message and a working retry', (tester) async {
    var retries = 0;
    await tester.pumpWidget(harness(view(error: 'Connexion au serveur impossible.', onRetry: () => retries++)));

    expect(find.text('Impossible de charger vos réservations'), findsOneWidget);
    expect(find.text('Connexion au serveur impossible.'), findsOneWidget);
    expect(find.text('Aucune réservation'), findsNothing);

    await tester.tap(find.text(fr.commonRetry));
    expect(retries, 1);
  });

  testWidgets('empty is its own state, with an optional action', (tester) async {
    var tapped = false;
    await tester.pumpWidget(harness(view(
      isEmpty: true,
      emptyAction: AppButton(label: 'Voir la carte', onPressed: () => tapped = true),
    )));

    expect(find.text('Aucune réservation'), findsOneWidget);
    expect(find.text('Réservez une place depuis la carte.'), findsOneWidget);
    expect(find.byType(ErrorStateView), findsNothing);
    await tester.tap(find.text('Voir la carte'));
    expect(tapped, isTrue);
  });

  testWidgets('with data, the builder renders', (tester) async {
    await tester.pumpWidget(harness(view()));
    expect(find.text('Parking Al Massira'), findsOneWidget);
  });

  testWidgets('in Arabic the error view is right-to-left and translated', (tester) async {
    await tester.pumpWidget(harness(
      AsyncView(loading: false, error: 'x', onRetry: () {}, builder: (_) => const SizedBox()),
      locale: const Locale('ar'),
    ));
    expect(find.text(ar.commonLoadError), findsOneWidget);
    expect(find.text(ar.commonRetry), findsOneWidget);
    final direction = Directionality.of(tester.element(find.byType(ErrorStateView)));
    expect(direction, TextDirection.rtl);
  });

  testWidgets('renders in the dark theme too', (tester) async {
    await tester.pumpWidget(harness(view(isEmpty: true), dark: true));
    expect(find.text('Aucune réservation'), findsOneWidget);
  });
}
