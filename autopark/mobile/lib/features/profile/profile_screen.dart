import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth_provider.dart';
import '../../core/locale_controller.dart';
import '../../core/realtime_service.dart';
import '../../core/theme_controller.dart';
import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../repositories/repositories.dart';
import '../../widgets/widgets.dart';
import 'security_sheet.dart';

const _rewardIcons = {
  'free_reservation': Icons.confirmation_number_outlined,
  'discount_coupon': Icons.card_giftcard_outlined,
  'free_wash': Icons.local_car_wash_outlined,
  'free_vidange': Icons.build_outlined,
};

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  RewardsBundle? _data;
  double? _balance;
  bool _loading = true;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final bundle = await rewardRepo.fetch();
      // The balance is a nice-to-have here: a wallet failure must not hide the
      // loyalty section behind an error state.
      double? balance;
      try {
        balance = (await paymentRepo.wallet()).balance;
      } catch (_) {
        balance = null;
      }
      if (!mounted) return;
      setState(() {
        _data = bundle;
        _balance = balance;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      // Was a debugPrint, so a failure looked exactly like an empty account.
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  Future<void> _logout() async {
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
    if (confirmed != true || !mounted) return;
    // Drop the socket before the token disappears, so the next account does not
    // inherit this one's subscriptions.
    context.read<RealtimeService>().disconnectSocket();
    if (!mounted) return;
    // The router redirects on the auth notification.
    await context.read<AuthProvider>().logout();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final l = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l.profileTitle)),
      body: RefreshIndicator(
        onRefresh: () => _load(silent: true),
        child: ListView(
          padding: const EdgeInsets.all(ApSpace.s4),
          children: [
            _Header(user: user),
            const AppGap(ApSpace.s6),

            Text(l.profileWallet, style: Theme.of(context).textTheme.titleMedium),
            const AppGap(ApSpace.s3),
            _WalletTile(balance: _balance, loading: _loading),
            const AppGap(ApSpace.s6),

            Text(l.profileLoyalty, style: Theme.of(context).textTheme.titleMedium),
            const AppGap(ApSpace.s3),
            SizedBox(
              height: _loading || _error != null ? 180 : null,
              child: AsyncView(
                loading: _loading,
                error: _error,
                onRetry: _load,
                errorTitle: l.profileRewardsError,
                loadingWidget: const SkeletonList(count: 2, itemHeight: 70),
                isEmpty: _data?.isEmpty ?? true,
                emptyIcon: Icons.card_giftcard_outlined,
                emptyTitle: l.profileNoPoints,
                emptyMessage: l.profileNoPointsHint,
                builder: (context) => Column(
                  children: [
                    for (final point in _data!.loyalty) ...[
                      AppCard(
                        child: Row(
                          children: [
                            Icon(Icons.local_parking, color: context.colors.parkingNormal),
                            const AppGap(ApSpace.s3, axis: Axis.horizontal),
                            Expanded(
                              child: Text(point.parkingName, style: Theme.of(context).textTheme.titleSmall),
                            ),
                            StatusBadge(label: l.profileStays(point.bookingCount), tone: AppTone.normal),
                          ],
                        ),
                      ),
                      const AppGap(ApSpace.s3),
                    ],
                    if (_data!.rewards.isNotEmpty) ...[
                      const AppGap(ApSpace.s3),
                      Align(
                        alignment: AlignmentDirectional.centerStart,
                        child: Text(l.profileRewards, style: Theme.of(context).textTheme.titleMedium),
                      ),
                      const AppGap(ApSpace.s3),
                      for (final reward in _data!.rewards) ...[
                        _RewardCard(reward: reward),
                        const AppGap(ApSpace.s3),
                      ],
                    ],
                  ],
                ),
              ),
            ),

            const AppGap(ApSpace.s6),
            Text(l.profileSettings, style: Theme.of(context).textTheme.titleMedium),
            const AppGap(ApSpace.s3),
            const _SettingsCard(),

            const AppGap(ApSpace.s6),
            AppButton(
              label: l.profileLogout,
              icon: Icons.logout_rounded,
              variant: AppButtonVariant.danger,
              expand: true,
              onPressed: _logout,
            ),
            const AppGap(ApSpace.s8),
          ],
        ),
      ),
    );
  }
}

/// Balance plus a way into the wallet. Shows a skeleton while loading and a
/// neutral label if the balance could not be read, never a misleading zero.
class _WalletTile extends StatelessWidget {
  final double? balance;
  final bool loading;

  const _WalletTile({required this.balance, required this.loading});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return AppCard(
      onTap: () => context.push('/wallet'),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: c.primarySoft,
              borderRadius: BorderRadius.circular(ApRadius.md),
            ),
            child: Icon(Icons.account_balance_wallet_outlined, color: c.primary, size: 20),
          ),
          const AppGap(ApSpace.s3, axis: Axis.horizontal),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(context.l10n.walletBalance, style: Theme.of(context).textTheme.bodySmall),
                const AppGap(ApSpace.s1),
                if (loading)
                  const SkeletonBox(width: 90, height: 18)
                else
                  Text(
                    balance == null ? context.l10n.walletUnavailable : mad(context, balance!, decimals: 2),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
              ],
            ),
          ),
          Icon(Icons.chevron_right_rounded, color: c.textMuted),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final AppUser? user;
  const _Header({required this.user});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final initials = (user?.fullName ?? 'AP')
        .trim()
        .split(RegExp(r'\s+'))
        .take(2)
        .map((w) => w.isEmpty ? '' : w[0])
        .join()
        .toUpperCase();

    return Container(
      padding: const EdgeInsets.all(ApSpace.s5),
      decoration: BoxDecoration(
        color: c.primary,
        borderRadius: BorderRadius.circular(ApRadius.lg),
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(color: c.onPrimary.withValues(alpha: 0.18), shape: BoxShape.circle),
            child: Center(
              child: Text(
                initials.isEmpty ? 'AP' : initials,
                style: TextStyle(color: c.onPrimary, fontSize: ApText.lg, fontWeight: ApWeight.bold),
              ),
            ),
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
                // An absent phone used to render as the literal text "null".
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
    );
  }
}

class _RewardCard extends StatelessWidget {
  final Reward reward;
  const _RewardCard({required this.reward});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final icon = _rewardIcons[reward.type] ?? Icons.card_giftcard_outlined;

    return AppCard(
      background: reward.unlocked ? c.spotFreeBg : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: reward.unlocked ? c.spotFree : c.accent),
              const AppGap(ApSpace.s3, axis: Axis.horizontal),
              Expanded(child: Text(isolate(reward.title), style: Theme.of(context).textTheme.titleSmall)),
              if (reward.unlocked) Icon(Icons.check_circle, color: c.spotFree, size: 20),
            ],
          ),
          if (reward.description.isNotEmpty) ...[
            const AppGap(ApSpace.s2),
            Text(isolate(reward.description), style: Theme.of(context).textTheme.bodySmall),
          ],
          const AppGap(ApSpace.s3),
          ClipRRect(
            borderRadius: BorderRadius.circular(ApRadius.full),
            child: LinearProgressIndicator(
              value: reward.progress / 100,
              minHeight: 8,
              backgroundColor: c.surfaceAlt,
              valueColor: AlwaysStoppedAnimation(reward.unlocked ? c.spotFree : c.primary),
            ),
          ),
          const AppGap(ApSpace.s2),
          Text(
            context.l10n.rewardProgress(reward.currentBookings, reward.requiredBookings) +
                (reward.parkingName != null ? ' · ${reward.parkingName}' : ''),
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  const _SettingsCard();

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = context.watch<ThemeController>();
    final locale = context.watch<LocaleController>();
    final label = switch (theme.mode) {
      ThemeMode.light => l.themeLight,
      ThemeMode.dark => l.themeDark,
      ThemeMode.system => l.themeSystem,
    };

    return AppCard(
      padding: const EdgeInsets.symmetric(vertical: ApSpace.s2),
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.brightness_6_outlined),
            title: Text(l.themeTitle),
            subtitle: Text(label),
            trailing: const Icon(Icons.chevron_right),
            onTap: theme.cycle,
          ),
          LanguageTile(controller: locale),
          const SecurityTile(),
          ListTile(
            leading: const Icon(Icons.notifications_none_rounded),
            title: Text(l.notificationsTitle),
            subtitle: Text(l.comingSoon),
            enabled: false,
            onTap: null,
          ),
        ],
      ),
    );
  }
}

/// French / Arabic switch. Each option is written in its own language, so a
/// reader of either can find theirs whichever language is showing.
class LanguageTile extends StatelessWidget {
  final LocaleController controller;
  const LanguageTile({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final current = controller.code == 'ar' ? l.languageArabic : l.languageFrench;

    return ListTile(
      leading: const Icon(Icons.language_outlined),
      title: Text(l.languageTitle),
      subtitle: Text(current),
      trailing: const Icon(Icons.chevron_right),
      onTap: () async {
        final picked = await showModalBottomSheet<String>(
          context: context,
          showDragHandle: true,
          builder: (ctx) => SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final (code, name) in [('fr', l.languageFrench), ('ar', l.languageArabic)])
                  ListTile(
                    title: Text(
                      name,
                      textDirection: code == 'ar' ? TextDirection.rtl : TextDirection.ltr,
                    ),
                    trailing: controller.code == code
                        ? Icon(Icons.check_rounded, color: context.colors.primary)
                        : null,
                    onTap: () => Navigator.of(ctx).pop(code),
                  ),
                const SizedBox(height: ApSpace.s2),
              ],
            ),
          ),
        );
        if (picked != null) await controller.set(picked);
      },
    );
  }
}
