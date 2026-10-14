import 'package:flutter/material.dart';

import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';

/// Shown while the stored session is read. The router moves on as soon as
/// AuthProvider reports it has bootstrapped.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Scaffold(
      backgroundColor: c.primary,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 84,
              height: 84,
              decoration: BoxDecoration(
                color: c.onPrimary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(ApRadius.xl),
              ),
              child: Center(
                child: Text(
                  'AP',
                  style: TextStyle(color: c.onPrimary, fontSize: ApText.xl2, fontWeight: ApWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: ApSpace.s5),
            Text(
              'AutoPark',
              style: TextStyle(color: c.onPrimary, fontSize: ApText.xl2, fontWeight: ApWeight.bold),
            ),
            const SizedBox(height: ApSpace.s2),
            Text(
              context.l10n.city,
              style: TextStyle(color: c.onPrimary.withValues(alpha: 0.75), fontSize: ApText.sm),
            ),
            const SizedBox(height: ApSpace.s8),
            SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2, color: c.onPrimary),
            ),
          ],
        ),
      ),
    );
  }
}
