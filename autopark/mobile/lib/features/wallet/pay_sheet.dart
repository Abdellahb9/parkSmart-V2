import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../repositories/repositories.dart';
import '../../widgets/widgets.dart';

/// Picks a payment method and settles the charge.
///
/// Shared by the booking stepper and the reservations screen so the rules —
/// wallet needs enough balance, a card charge needs a second confirmation,
/// cash is collected at the barrier — live in exactly one place.
///
/// Returns the paid booking, or null if the user backed out or payment failed.
Future<Booking?> showPaySheet(
  BuildContext context, {
  required Booking booking,
}) {
  return showModalBottomSheet<Booking>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (ctx) => _PaySheet(booking: booking),
  );
}

class _PaySheet extends StatefulWidget {
  final Booking booking;

  const _PaySheet({required this.booking});

  @override
  State<_PaySheet> createState() => _PaySheetState();
}

class _PaySheetState extends State<_PaySheet> {
  PaymentMethod _method = PaymentMethod.wallet;
  double? _balance;
  bool _loadingBalance = true;
  bool _paying = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadBalance();
  }

  Future<void> _loadBalance() async {
    try {
      final wallet = await paymentRepo.wallet();
      if (!mounted) return;
      setState(() {
        _balance = wallet.balance;
        _loadingBalance = false;
        // Do not preselect a method the balance cannot cover.
        if (wallet.balance < widget.booking.totalPrice) _method = PaymentMethod.card;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingBalance = false);
    }
  }

  bool get _walletCovers =>
      _balance != null && _balance! >= widget.booking.totalPrice;

  Future<void> _pay() async {
    setState(() {
      _paying = true;
      _error = null;
    });
    try {
      final result = await paymentRepo.payBooking(widget.booking.id, _method);
      var booking = result.booking;

      // A card charge comes back pending; settling it is the gateway's job,
      // which the mock performs on request.
      if (result.payment.status == PaymentStatus.pending && _method == PaymentMethod.card) {
        final settled = await paymentRepo.confirm(result.payment.id);
        if (settled.status != PaymentStatus.paid) {
          if (!mounted) return;
          setState(() {
            _paying = false;
            _error = settled.failureReason.isEmpty ? context.l10n.payRefused : settled.failureReason;
          });
          return;
        }
        booking = await bookingRepo.byId(widget.booking.id);
      }

      if (!mounted) return;
      HapticFeedback.mediumImpact();
      Navigator.of(context).pop(booking);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _paying = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final price = widget.booking.totalPrice;

    return Padding(
      padding: const EdgeInsets.fromLTRB(ApSpace.s5, 0, ApSpace.s5, ApSpace.s6),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(l.payTitle, style: Theme.of(context).textTheme.titleMedium),
          const AppGap(ApSpace.s2),
          Text(
            l.payDetail(widget.booking.spotNumber, widget.booking.totalHours),
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const AppGap(ApSpace.s4),

          Container(
            padding: const EdgeInsets.all(ApSpace.s4),
            decoration: BoxDecoration(
              color: c.surfaceAlt,
              borderRadius: BorderRadius.circular(ApRadius.md),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(l.payTotal, style: Theme.of(context).textTheme.bodyMedium),
                Text(
                  mad(context, price, decimals: 2),
                  style: TextStyle(fontSize: ApText.lg, fontWeight: ApWeight.bold, color: c.text),
                ),
              ],
            ),
          ),
          const AppGap(ApSpace.s4),

          _MethodTile(
            method: PaymentMethod.wallet,
            selected: _method == PaymentMethod.wallet,
            enabled: _walletCovers,
            subtitle: _loadingBalance
                ? l.payReadingBalance
                : _balance == null
                    ? l.payBalanceUnavailable
                    : _walletCovers
                        ? l.payBalance(mad(context, _balance!, decimals: 2))
                        : l.payBalanceLow(mad(context, _balance!, decimals: 2)),
            icon: Icons.account_balance_wallet_outlined,
            onTap: () => setState(() => _method = PaymentMethod.wallet),
          ),
          _MethodTile(
            method: PaymentMethod.card,
            selected: _method == PaymentMethod.card,
            enabled: true,
            subtitle: l.payCardSubtitle,
            icon: Icons.credit_card_rounded,
            onTap: () => setState(() => _method = PaymentMethod.card),
          ),
          _MethodTile(
            method: PaymentMethod.cash,
            selected: _method == PaymentMethod.cash,
            enabled: true,
            subtitle: l.payCashSubtitle,
            icon: Icons.payments_outlined,
            onTap: () => setState(() => _method = PaymentMethod.cash),
          ),

          if (_error != null) ...[
            const AppGap(ApSpace.s3),
            Text(_error!, style: TextStyle(color: c.danger, fontSize: ApText.xs)),
          ],

          const AppGap(ApSpace.s5),
          AppButton(
            label: _method == PaymentMethod.cash
                ? l.payOnSite
                : l.payAmount(mad(context, price)),
            icon: Icons.lock_outline_rounded,
            loading: _paying,
            onPressed: _paying ? null : _pay,
            expand: true,
          ),
        ],
      ),
    );
  }
}

class _MethodTile extends StatelessWidget {
  final PaymentMethod method;
  final bool selected;
  final bool enabled;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  const _MethodTile({
    required this.method,
    required this.selected,
    required this.enabled,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final methodLabel = switch (method) {
      PaymentMethod.wallet => l.methodWallet,
      PaymentMethod.card => l.methodCard,
      PaymentMethod.cash => l.methodCash,
    };
    return Opacity(
      opacity: enabled ? 1 : 0.5,
      child: Container(
        margin: const EdgeInsets.only(bottom: ApSpace.s2),
        decoration: BoxDecoration(
          border: Border.all(color: selected ? c.primary : c.border, width: selected ? 2 : 1),
          borderRadius: BorderRadius.circular(ApRadius.md),
        ),
        child: ListTile(
          onTap: enabled ? onTap : null,
          leading: Icon(icon, color: selected ? c.primary : c.textMuted),
          title: Text(methodLabel),
          subtitle: Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
          // A plain icon rather than a Radio: RadioGroup would need an
          // ancestor around the three tiles for no behavioural gain, since the
          // whole tile is already the tap target.
          trailing: Icon(
            selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
            color: selected ? c.primary : c.textMuted,
          ),
        ),
      ),
    );
  }
}
