import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/auth_provider.dart';
import '../../core/locale_controller.dart';
import '../../core/theme_controller.dart';
import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../profile/profile_screen.dart' show LanguageTile;
import '../profile/security_sheet.dart';
import '../../widgets/widgets.dart';

class TechProfileScreen extends StatelessWidget {
  const TechProfileScreen({super.key});

  Future<void> _logout(BuildContext context) async {
    final l = context.l10n;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l.logoutTitle),
        content: Text(l.logoutBody),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: Text(l.logoutStay)),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(l.logoutConfirm, style: TextStyle(color: context.colors.danger)),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    await context.read<AuthProvider>().logout();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final user = context.watch<AuthProvider>().user;
    final l = context.l10n;
    final theme = context.watch<ThemeController>();
    final locale = context.watch<LocaleController>();
    final themeLabel = switch (theme.mode) {
      ThemeMode.light => l.themeLight,
      ThemeMode.dark => l.themeDark,
      ThemeMode.system => l.themeSystem,
    };

    return Scaffold(
      appBar: AppBar(title: Text(l.profileTitle)),
      // Scrollable: the old fixed Column with a Spacer overflowed on short
      // screens and at larger text sizes.
      body: ListView(
        padding: const EdgeInsets.all(ApSpace.s4),
        children: [
          Container(
            padding: const EdgeInsets.all(ApSpace.s5),
            decoration: BoxDecoration(color: c.primary, borderRadius: BorderRadius.circular(ApRadius.lg)),
            child: Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: c.onPrimary.withValues(alpha: 0.18),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.engineering_outlined, color: c.onPrimary),
                ),
                const AppGap(ApSpace.s4, axis: Axis.horizontal),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.fullName ?? '—',
                        style: TextStyle(color: c.onPrimary, fontSize: ApText.lg, fontWeight: ApWeight.semibold),
                      ),
                      const AppGap(ApSpace.s1),
                      Text(
                        user?.email ?? '',
                        // Emails and phone numbers read left to right even in Arabic; without
                        // this the bidi algorithm prints +212… as 212…+.
                        textDirection: TextDirection.ltr,
                        style: TextStyle(color: c.onPrimary.withValues(alpha: 0.8), fontSize: ApText.sm),
                      ),
                      if (user?.phone != null)
                        Text(
                          user!.phone!,
                          textDirection: TextDirection.ltr,
                          style: TextStyle(color: c.onPrimary.withValues(alpha: 0.8), fontSize: ApText.sm),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const AppGap(ApSpace.s4),
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: StatusBadge(label: l.roleTechnician, tone: AppTone.street, dot: true),
          ),
          const AppGap(ApSpace.s6),
          AppCard(
            padding: const EdgeInsets.symmetric(vertical: ApSpace.s2),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.brightness_6_outlined),
                  title: Text(l.themeTitle),
                  subtitle: Text(themeLabel),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: theme.cycle,
                ),
                LanguageTile(controller: locale),
                const SecurityTile(),
              ],
            ),
          ),
          const AppGap(ApSpace.s6),
          AppButton(
            label: l.profileLogout,
            icon: Icons.logout_rounded,
            variant: AppButtonVariant.danger,
            expand: true,
            onPressed: () => _logout(context),
          ),
        ],
      ),
    );
  }
}
