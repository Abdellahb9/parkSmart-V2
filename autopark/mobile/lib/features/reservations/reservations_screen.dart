import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
// intl has its own TextDirection; the widgets need Flutter's.
import 'package:intl/intl.dart' hide TextDirection;
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../repositories/repositories.dart';
import '../wallet/pay_sheet.dart';
import '../../widgets/widgets.dart';

class ReservationsScreen extends StatefulWidget {
  const ReservationsScreen({super.key});

  @override
  State<ReservationsScreen> createState() => _ReservationsScreenState();
}

class _ReservationsScreenState extends State<ReservationsScreen> {
  List<Booking> _bookings = [];
  Map<String, Parking> _parkings = {};
  bool _loading = true;
  Object? _error;
  Timer? _tick;
  Timer? _poll;
  bool _extending = false;

  @override
  void initState() {
    super.initState();
    _load();
    // One clock for the whole screen; both timers are cancelled in dispose.
    _tick = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
    _poll = Timer.periodic(const Duration(seconds: 30), (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _tick?.cancel();
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final results = await Future.wait([bookingRepo.mine(), parkingRepo.list()]);
      if (!mounted) return;
      setState(() {
        _bookings = results[0] as List<Booking>;
        _parkings = {for (final p in results[1] as List<Parking>) p.id: p};
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

  Booking? get _active {
    for (final b in _bookings) {
      if (b.isActive) return b;
    }
    return null;
  }

  List<Booking> get _past => _bookings.where((b) => !b.isActive).toList();

  Future<void> _cancel(Booking booking) async {
    final l = context.l10n;
    final estimate = mad(context, booking.totalPrice * 0.2);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l.resCancelTitle),
        content: Text(l.resCancelBody(estimate)),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: Text(l.commonBack)),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(l.resCancelConfirm, style: TextStyle(color: context.colors.danger)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    try {
      // The server is authoritative on the fee; show what it actually charged.
      final fee = await bookingRepo.cancel(booking.id);
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l.resCancelled(mad(context, fee)))),
      );
      _load(silent: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _pay(Booking booking) async {
    final paid = await showPaySheet(context, booking: booking);
    if (paid == null || !mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          paid.isPaid ? context.l10n.resPaid(mad(context, paid.totalPrice)) : context.l10n.resPayOnSite,
        ),
      ),
    );
    await _load(silent: true);
  }

  Future<void> _showQr(Booking booking) async {
    final token = booking.qrToken;
    if (token == null || token.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.resNoCode)),
      );
      return;
    }
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => _QrSheet(booking: booking, token: token),
    );
  }

  Future<void> _extend(Booking booking) async {
    final end = booking.endTime;
    if (end == null) return;
    final extra = await showModalBottomSheet<Duration>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => _ExtendSheet(
        booking: booking,
        pricePerHour: _parkings[booking.parkingId]?.pricePerHour ?? 0,
      ),
    );
    if (extra == null || !mounted) return;

    setState(() => _extending = true);
    try {
      // The server recomputes the total; we only report what it charged.
      final result = await bookingRepo.extend(booking.id, end.add(extra));
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.l10n.resExtended(
              DateFormat.Hm(context.l10n.localeName).format(result.booking.endTime ?? end),
              signedMad(context, result.addedPrice, sign: '+'),
            ),
          ),
        ),
      );
      await _load(silent: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _extending = false);
    }
  }

  Future<void> _navigateTo(Booking booking) async {
    final parking = _parkings[booking.parkingId];
    if (parking == null || !parking.hasPosition) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.resNoPosition)),
      );
      return;
    }
    final uri = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=${parking.latitude},${parking.longitude}',
    );
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.resNavFailed)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final active = _active;
    final l = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l.resTitle)),
      body: RefreshIndicator(
        onRefresh: () => _load(silent: true),
        child: AsyncView(
          loading: _loading,
          error: _error,
          onRetry: _load,
          isEmpty: _bookings.isEmpty,
          emptyIcon: Icons.event_busy_outlined,
          emptyTitle: l.resEmpty,
          emptyMessage: l.resEmptyHint,
          builder: (context) => ListView(
            padding: const EdgeInsets.all(ApSpace.s4),
            children: [
              if (active != null) ...[
                _ActiveBookingCard(
                  booking: active,
                  parking: _parkings[active.parkingId],
                  extending: _extending,
                  onCancel: () => _cancel(active),
                  onNavigate: () => _navigateTo(active),
                  onShowQr: () => _showQr(active),
                  onExtend: () => _extend(active),
                  onPay: () => _pay(active),
                ),
                const AppGap(ApSpace.s6),
              ],
              Text(l.resHistory, style: Theme.of(context).textTheme.titleMedium),
              const AppGap(ApSpace.s3),
              if (_past.isEmpty)
                AppCard(
                  child: Text(
                    l.resNoPast,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                )
              else
                for (final b in _past) ...[
                  _PastBookingTile(booking: b),
                  const AppGap(ApSpace.s3),
                ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ActiveBookingCard extends StatelessWidget {
  final Booking booking;
  final Parking? parking;
  final bool extending;
  final VoidCallback onCancel;
  final VoidCallback onNavigate;
  final VoidCallback onShowQr;
  final VoidCallback onExtend;
  final VoidCallback onPay;

  const _ActiveBookingCard({
    required this.booking,
    required this.parking,
    required this.extending,
    required this.onCancel,
    required this.onNavigate,
    required this.onShowQr,
    required this.onExtend,
    required this.onPay,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final overstay = booking.isOverstay;
    final seconds = booking.secondsRemaining.abs();
    final label = _format(seconds);

    return AppCard(
      elevated: true,
      background: overstay ? c.spotOverstayBg : c.surface,
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(booking.parkingName ?? parking?.name ?? '',
                        style: Theme.of(context).textTheme.titleMedium),
                    const AppGap(ApSpace.s1),
                    Text(l.spotAndPlate(booking.spotNumber, isolate(booking.carPlate)),
                        style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              StatusBadge(
                label: overstay ? l.resOverstay : l.resInProgress,
                tone: overstay ? AppTone.overstay : AppTone.free,
                icon: overstay ? Icons.warning_amber_rounded : null,
                dot: !overstay,
              ),
            ],
          ),
          const AppGap(ApSpace.s5),

          // Progress runs from startTime, so a booking that has not begun no
          // longer shows a full ring frozen at zero.
          Semantics(
            label: overstay ? l.resOverstayOf(label) : l.resRemainingOf(label),
            child: SizedBox(
              width: 170,
              height: 170,
              child: CustomPaint(
                painter: _RingPainter(
                  progress: booking.progress,
                  track: c.surfaceAlt,
                  color: overstay ? c.spotOverstay : c.primary,
                ),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        overstay ? '+$label' : label,
                        // A clock reads left to right in Arabic too; otherwise the
                        // overrun shows as 13:26:08+.
                        textDirection: TextDirection.ltr,
                        style: TextStyle(
                          fontSize: ApText.xl2,
                          fontWeight: ApWeight.bold,
                          color: overstay ? c.spotOverstay : c.text,
                        ),
                      ),
                      Text(
                        overstay ? l.resBeyond : l.resLeft,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          if (overstay) ...[
            const AppGap(ApSpace.s4),
            Container(
              padding: const EdgeInsets.all(ApSpace.s3),
              decoration: BoxDecoration(
                color: c.surface,
                borderRadius: BorderRadius.circular(ApRadius.md),
                border: Border.all(color: c.spotOverstay.withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  Icon(Icons.gavel_rounded, size: 18, color: c.spotOverstay),
                  const AppGap(ApSpace.s2, axis: Axis.horizontal),
                  Expanded(
                    child: Text(
                      l.resOverstayWarning,
                      style: TextStyle(fontSize: ApText.xs, color: c.spotOverstay),
                    ),
                  ),
                ],
              ),
            ),
          ],

          if (!booking.isPaid) ...[
            const AppGap(ApSpace.s4),
            _PaymentNotice(booking: booking, onPay: onPay),
          ],

          const AppGap(ApSpace.s5),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  label: l.resEntryCode,
                  icon: Icons.qr_code_2_rounded,
                  onPressed: onShowQr,
                  expand: true,
                ),
              ),
              const AppGap(ApSpace.s3, axis: Axis.horizontal),
              Expanded(
                child: AppButton(
                  label: l.resExtend,
                  icon: Icons.more_time_rounded,
                  variant: AppButtonVariant.accent,
                  loading: extending,
                  onPressed: onExtend,
                  expand: true,
                ),
              ),
            ],
          ),
          const AppGap(ApSpace.s3),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  label: l.resGo,
                  icon: Icons.directions_outlined,
                  variant: AppButtonVariant.secondary,
                  onPressed: onNavigate,
                  expand: true,
                ),
              ),
              const AppGap(ApSpace.s3, axis: Axis.horizontal),
              Expanded(
                child: AppButton(
                  label: l.commonCancel,
                  icon: Icons.close_rounded,
                  variant: AppButtonVariant.danger,
                  onPressed: onCancel,
                  expand: true,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  static String _format(int totalSeconds) {
    final h = totalSeconds ~/ 3600;
    final m = (totalSeconds % 3600) ~/ 60;
    final s = totalSeconds % 60;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }
}

/// Says what is still owed and offers to settle it. Hidden once the stay is
/// paid, so a settled booking carries no leftover call to action.
class _PaymentNotice extends StatelessWidget {
  final Booking booking;
  final VoidCallback onPay;

  const _PaymentNotice({required this.booking, required this.onPay});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final awaitingCash = booking.awaitsCash;

    return Container(
      padding: const EdgeInsets.all(ApSpace.s3),
      decoration: BoxDecoration(
        color: c.surfaceAlt,
        borderRadius: BorderRadius.circular(ApRadius.md),
        border: Border.all(color: awaitingCash ? c.spotReserved : c.border),
      ),
      child: Row(
        children: [
          Icon(
            awaitingCash ? Icons.payments_outlined : Icons.credit_card_off_outlined,
            size: 18,
            color: awaitingCash ? c.spotReserved : c.textMuted,
          ),
          const AppGap(ApSpace.s2, axis: Axis.horizontal),
          Expanded(
            child: Text(
              awaitingCash
                  ? l.resAwaitCash(mad(context, booking.totalPrice))
                  : l.resUnpaid(mad(context, booking.totalPrice)),
              style: TextStyle(fontSize: ApText.xs, color: c.text),
            ),
          ),
          if (!awaitingCash)
            AppButton(
              label: l.resPay,
              variant: AppButtonVariant.accent,
              onPressed: onPay,
            ),
        ],
      ),
    );
  }
}

/// The entry code. Scanned by the owner or technician, who posts the token to
/// `/bookings/:id/check-in`; the id travels in the payload so one scan is
/// enough.
class _QrSheet extends StatelessWidget {
  final Booking booking;
  final String token;

  const _QrSheet({required this.booking, required this.token});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final payload = 'autopark://checkin?b=${booking.id}&t=$token';

    return Padding(
      padding: const EdgeInsets.fromLTRB(ApSpace.s5, 0, ApSpace.s5, ApSpace.s6),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(l.resEntryCode, style: Theme.of(context).textTheme.titleMedium),
          const AppGap(ApSpace.s2),
          Text(
            l.qrHint,
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
          const AppGap(ApSpace.s5),
          // Always on white: a dark-themed surface would not scan.
          Container(
            padding: const EdgeInsets.all(ApSpace.s4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(ApRadius.lg),
            ),
            child: QrImageView(
              data: payload,
              version: QrVersions.auto,
              size: 220,
              backgroundColor: Colors.white,
              eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
              dataModuleStyle: const QrDataModuleStyle(
                dataModuleShape: QrDataModuleShape.square,
                color: Colors.black,
              ),
            ),
          ),
          const AppGap(ApSpace.s4),
          Text(
            l.spotAndPlate(booking.spotNumber, isolate(booking.carPlate)),
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const AppGap(ApSpace.s2),
          // Manual fallback when a camera is unavailable.
          SelectableText(
            token,
            style: TextStyle(
              fontSize: ApText.xs,
              color: context.colors.textMuted,
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }
}

/// Extension choices, with the server's 24h ceiling applied up front so the
/// user never taps an option that comes back as an error.
class _ExtendSheet extends StatelessWidget {
  final Booking booking;
  final double pricePerHour;

  const _ExtendSheet({required this.booking, required this.pricePerHour});

  static const _options = [
    Duration(minutes: 30),
    Duration(hours: 1),
    Duration(hours: 2),
    Duration(hours: 3),
  ];

  static String _labelFor(AppLocalizations l, Duration d) => switch (d.inMinutes) {
        30 => l.duration30m,
        60 => l.duration1h,
        120 => l.duration2h,
        _ => l.duration3h,
      };

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final start = booking.startTime;
    final end = booking.endTime;

    return Padding(
      padding: const EdgeInsets.fromLTRB(ApSpace.s5, 0, ApSpace.s5, ApSpace.s6),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(l.extendTitle, style: Theme.of(context).textTheme.titleMedium),
          const AppGap(ApSpace.s2),
          Text(
            end == null
                ? l.extendChoose
                : l.extendCurrentEnd(DateFormat('d MMM, HH:mm', l.localeName).format(end)),
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const AppGap(ApSpace.s4),
          for (final option in _options) ...[
            Builder(
              builder: (context) {
                if (start == null || end == null) {
                  return const SizedBox.shrink();
                }
                final newEnd = end.add(option);
                // Mirrors the server: hours are billed from startTime, rounded up.
                final newHours =
                    math.max(1, (newEnd.difference(start).inSeconds / 3600).ceil());
                final allowed = newHours <= 24;
                final extra = (newHours - booking.totalHours) * pricePerHour;

                return Opacity(
                  opacity: allowed ? 1 : 0.5,
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(Icons.schedule_rounded, color: allowed ? c.primary : c.textMuted),
                    title: Text(_labelFor(l, option)),
                    subtitle: Text(
                      allowed
                          ? l.extendUntil(DateFormat.Hm(l.localeName).format(newEnd)) +
                              (extra > 0 ? l.extendApprox(signedMad(context, extra, sign: '+')) : '')
                          : l.extendTooLong,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    trailing: allowed ? const Icon(Icons.chevron_right_rounded) : null,
                    onTap: allowed ? () => Navigator.of(context).pop(option) : null,
                  ),
                );
              },
            ),
          ],
          const AppGap(ApSpace.s2),
          Text(
            l.extendServerNote,
            style: TextStyle(fontSize: ApText.xs, color: c.textMuted),
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  final Color track;
  final Color color;

  _RingPainter({required this.progress, required this.track, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 12.0;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.shortestSide - stroke) / 2;

    final base = Paint()
      ..color = track
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke;
    final arc = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, base);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress.clamp(0.0, 1.0),
      false,
      arc,
    );
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) =>
      old.progress != progress || old.color != color || old.track != track;
}

class _PastBookingTile extends StatelessWidget {
  final Booking booking;
  const _PastBookingTile({required this.booking});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final fmt = DateFormat('d MMM yyyy, HH:mm', l.localeName);
    final (String label, AppTone tone) = switch (booking.status) {
      BookingStatus.done => (l.statusDone, AppTone.neutral),
      BookingStatus.cancelled => (l.statusCancelled, AppTone.occupied),
      BookingStatus.pending => (l.statusPending, AppTone.reserved),
      _ => ('—', AppTone.neutral),
    };

    return AppCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(booking.parkingName ?? '', style: Theme.of(context).textTheme.titleSmall),
                const AppGap(ApSpace.s1),
                // The old history showed no dates at all.
                Text(
                  booking.startTime != null ? fmt.format(booking.startTime!) : '—',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                Text(
                  l.resPastLine(booking.spotNumber, booking.totalHours, mad(context, booking.totalPrice)),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          StatusBadge(label: label, tone: tone),
        ],
      ),
    );
  }
}
