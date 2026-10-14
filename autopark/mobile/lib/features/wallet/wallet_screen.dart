import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
// intl has its own TextDirection; the widgets need Flutter's.
import 'package:intl/intl.dart' hide TextDirection;

import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../repositories/repositories.dart';
import '../../widgets/widgets.dart';

/// Prepaid balance and its history.
///
/// A top-up is two calls — create, then confirm — because that is the shape a
/// real gateway imposes. The mock settles instantly, so the user sees one
/// spinner and a new balance.
class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  Wallet? _wallet;
  bool _loading = true;
  bool _toppingUp = false;
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
      final wallet = await paymentRepo.wallet();
      if (!mounted) return;
      setState(() {
        _wallet = wallet;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  Future<void> _topUp() async {
    final amount = await showModalBottomSheet<double>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) => const _TopUpSheet(),
    );
    if (amount == null || !mounted) return;

    setState(() => _toppingUp = true);
    try {
      final pending = await paymentRepo.topUp(amount);
      final settled = await paymentRepo.confirm(pending.id);
      if (!mounted) return;

      if (settled.status == PaymentStatus.paid) {
        HapticFeedback.mediumImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.walletToppedUp(mad(context, amount)))),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              settled.failureReason.isEmpty ? context.l10n.walletTopUpRefused : settled.failureReason,
            ),
          ),
        );
      }
      await _load(silent: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _toppingUp = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final payments = _wallet?.payments ?? const <Payment>[];
    final l = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l.walletTitle)),
      body: RefreshIndicator(
        onRefresh: () => _load(silent: true),
        child: AsyncView(
          loading: _loading,
          error: _error,
          onRetry: _load,
          errorTitle: l.walletLoadError,
          builder: (context) => ListView(
            padding: const EdgeInsets.all(ApSpace.s4),
            children: [
              _BalanceCard(
                balance: _wallet?.balance ?? 0,
                busy: _toppingUp,
                onTopUp: _topUp,
              ),
              const AppGap(ApSpace.s6),
              Text(l.walletHistory, style: Theme.of(context).textTheme.titleMedium),
              const AppGap(ApSpace.s3),
              if (payments.isEmpty)
                AppCard(
                  child: Text(
                    l.walletEmpty,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                )
              else
                for (final p in payments) ...[
                  _PaymentTile(payment: p),
                  const AppGap(ApSpace.s2),
                ],
            ],
          ),
        ),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final double balance;
  final bool busy;
  final VoidCallback onTopUp;

  const _BalanceCard({required this.balance, required this.busy, required this.onTopUp});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return AppCard(
      elevated: true,
      background: c.primary,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.account_balance_wallet_outlined, color: c.onPrimary, size: 20),
              const AppGap(ApSpace.s2, axis: Axis.horizontal),
              Text(
                context.l10n.walletAvailable,
                style: TextStyle(color: c.onPrimary, fontSize: ApText.sm),
              ),
            ],
          ),
          const AppGap(ApSpace.s3),
          Text(
            mad(context, balance, decimals: 2),
            style: TextStyle(
              color: c.onPrimary,
              fontSize: ApText.xl3,
              fontWeight: ApWeight.bold,
            ),
          ),
          const AppGap(ApSpace.s4),
          AppButton(
            label: context.l10n.walletTopUp,
            icon: Icons.add_rounded,
            variant: AppButtonVariant.accent,
            loading: busy,
            onPressed: onTopUp,
            expand: true,
          ),
        ],
      ),
    );
  }
}

class _PaymentTile extends StatelessWidget {
  final Payment payment;

  const _PaymentTile({required this.payment});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final credit = payment.isCredit;
    final date = payment.paidAt ?? payment.createdAt;

    final l = context.l10n;
    final (tone, label) = switch (payment.status) {
      PaymentStatus.paid => (AppTone.free, l.payStatusPaid),
      PaymentStatus.pending => (AppTone.reserved, l.payStatusPending),
      PaymentStatus.failed => (AppTone.occupied, l.payStatusFailed),
      PaymentStatus.refunded => (AppTone.neutral, l.payStatusRefunded),
      _ => (AppTone.neutral, l.payStatusCancelled),
    };
    final title = switch (payment.kind) {
      'topup' => l.paymentKindTopup,
      'refund' => l.paymentKindRefund,
      _ => payment.parkingName ?? l.paymentKindBooking,
    };

    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: ApSpace.s4, vertical: ApSpace.s3),
      child: Row(
        children: [
          Icon(
            credit ? Icons.south_west_rounded : Icons.north_east_rounded,
            size: 18,
            color: credit ? c.spotFree : c.textMuted,
          ),
          const AppGap(ApSpace.s3, axis: Axis.horizontal),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleSmall),
                if (date != null)
                  Text(
                    DateFormat('d MMM, HH:mm', l.localeName).format(date),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                signedMad(context, payment.amount, sign: credit ? '+' : '−', decimals: 2),
                style: TextStyle(
                  fontWeight: ApWeight.semibold,
                  color: credit ? c.spotFree : c.text,
                ),
              ),
              const AppGap(ApSpace.s1),
              StatusBadge(label: label, tone: tone),
            ],
          ),
        ],
      ),
    );
  }
}

class _TopUpSheet extends StatefulWidget {
  const _TopUpSheet();

  @override
  State<_TopUpSheet> createState() => _TopUpSheetState();
}

class _TopUpSheetState extends State<_TopUpSheet> {
  static const _presets = [50.0, 100.0, 200.0, 500.0];
  final _controller = TextEditingController();
  double? _selected;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  double? get _amount {
    if (_selected != null) return _selected;
    final typed = double.tryParse(_controller.text.replaceAll(',', '.'));
    if (typed == null || typed <= 0 || typed > 5000) return null;
    return typed;
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final amount = _amount;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        ApSpace.s5,
        0,
        ApSpace.s5,
        ApSpace.s6 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(l.walletTopUpTitle, style: Theme.of(context).textTheme.titleMedium),
          const AppGap(ApSpace.s2),
          Text(
            l.walletTopUpHint,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const AppGap(ApSpace.s4),
          Wrap(
            spacing: ApSpace.s2,
            runSpacing: ApSpace.s2,
            children: [
              for (final preset in _presets)
                ChoiceChip(
                  label: Text(mad(context, preset)),
                  selected: _selected == preset,
                  onSelected: (_) => setState(() {
                    _selected = preset;
                    _controller.clear();
                  }),
                ),
            ],
          ),
          const AppGap(ApSpace.s4),
          TextField(
            controller: _controller,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: l.walletOtherAmount,
              suffixText: l.amountMad('').trim(),
              hintText: l.walletAmountHint,
            ),
            onChanged: (_) => setState(() => _selected = null),
          ),
          const AppGap(ApSpace.s2),
          Text(
            l.walletLimits,
            style: TextStyle(fontSize: ApText.xs, color: c.textMuted),
          ),
          const AppGap(ApSpace.s5),
          AppButton(
            label: amount == null ? l.walletChoose : l.payAmount(mad(context, amount)),
            icon: Icons.credit_card_rounded,
            onPressed: amount == null ? null : () => Navigator.of(context).pop(amount),
            expand: true,
          ),
        ],
      ),
    );
  }
}
