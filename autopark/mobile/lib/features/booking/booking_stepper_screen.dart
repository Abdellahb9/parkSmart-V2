import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
// intl has its own TextDirection; the widgets need Flutter's.
import 'package:intl/intl.dart' hide TextDirection;

import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../repositories/repositories.dart';
import '../wallet/pay_sheet.dart';
import '../../widgets/widgets.dart';

/// Créneau -> Place -> Récapitulatif, in one route that owns its own state.
///
/// The time comes first because a spot's availability only means something
/// for a given window: the grid is fetched for the chosen slot (?from=&to=),
/// so a spot booked from 18:00 can still be taken at 14:00, and one that is
/// free right now but booked tonight is not offered for tonight.
///
/// Replaces three screens that passed an untyped map through `state.extra`,
/// collected only a TimeOfDay (so an overnight booking silently inverted),
/// and had a "Continuer" button that never re-enabled while you typed.
class BookingStepperScreen extends StatefulWidget {
  final String parkingId;
  const BookingStepperScreen({super.key, required this.parkingId});

  @override
  State<BookingStepperScreen> createState() => _BookingStepperScreenState();
}

class _BookingStepperScreenState extends State<BookingStepperScreen> {
  final _plate = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  Parking? _meta;
  bool _loading = true;
  Object? _error;

  // The spot grid belongs to one window; it is refetched when that changes.
  List<Spot> _grid = const [];
  bool _gridLoading = false;
  Object? _gridError;
  String? _gridWindow;

  int _step = 0;
  int? _spot;
  late DateTime _start;
  late DateTime _end;
  bool _submitting = false;
  String? _submitError;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    // Plain DateTime arithmetic: TimeOfDay(hour: now.hour + 2) asserted
    // between 22:00 and midnight.
    _start = DateTime(now.year, now.month, now.day, now.hour, now.minute);
    _end = _start.add(const Duration(hours: 2));
    _load();
  }

  @override
  void dispose() {
    _plate.dispose();
    super.dispose();
  }

  String get _windowKey => '${_start.toIso8601String()}|${_end.toIso8601String()}';

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final meta = await parkingRepo.byId(widget.parkingId);
      if (!mounted) return;
      setState(() {
        _meta = meta;
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

  Future<void> _loadSpots() async {
    final window = _windowKey;
    setState(() {
      _gridLoading = true;
      _gridError = null;
    });
    try {
      final parking = await parkingRepo.spots(widget.parkingId, from: _start, to: _end);
      // The driver went back and changed the slot meanwhile: this answer is stale.
      if (!mounted || window != _windowKey) return;
      final grid = parking.spots;
      final lost = (_spot != null && !grid.any((s) => s.spotNumber == _spot && s.isFree)) ? _spot : null;
      setState(() {
        _grid = grid;
        _gridWindow = window;
        _gridLoading = false;
        if (lost != null) _spot = null;
      });
      if (lost != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.bookingSpotTaken(lost))));
      }
    } catch (e) {
      if (!mounted || window != _windowKey) return;
      setState(() {
        _gridError = e;
        _gridLoading = false;
      });
    }
  }

  double get _pricePerHour => _meta?.pricePerHour ?? 0;

  BookingDraft get _draft => BookingDraft(
        parkingId: widget.parkingId,
        parkingName: _meta?.name ?? '',
        pricePerHour: _pricePerHour,
        spotNumber: _spot ?? 0,
        carPlate: _plate.text.trim().toUpperCase(),
        start: _start,
        end: _end,
      );

  Future<DateTime?> _pickDateTime(DateTime initial) async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(now) ? now : initial,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 30)),
    );
    if (date == null || !mounted) return null;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
      // Morocco uses a 24-hour clock; the default picker showed AM/PM.
      builder: (ctx, child) => MediaQuery(
        data: MediaQuery.of(ctx).copyWith(alwaysUse24HourFormat: true),
        child: child!,
      ),
    );
    if (time == null) return null;
    return DateTime(date.year, date.month, date.day, time.hour, time.minute);
  }

  String? _rangeError() {
    final l = context.l10n;
    if (!_end.isAfter(_start)) return l.bookingRangeOrder;
    if (_end.difference(_start).inMinutes > 24 * 60) return l.bookingRangeMax;
    if (_start.isBefore(DateTime.now().subtract(const Duration(minutes: 10)))) {
      return l.bookingRangePast;
    }
    return null;
  }

  void _goToSpots() {
    setState(() => _step = 1);
    if (_gridWindow != _windowKey) _loadSpots();
  }

  void _next() {
    FocusScope.of(context).unfocus();
    if (_step == 0) {
      if (!(_formKey.currentState?.validate() ?? false)) return;
      final rangeError = _rangeError();
      if (rangeError != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(rangeError)));
        return;
      }
      _goToSpots();
      return;
    }
    if (_step == 1) {
      if (_spot == null) return;
      setState(() {
        _step = 2;
        _submitError = null;
      });
    }
  }

  void _back() {
    if (_step == 0) {
      context.pop();
      return;
    }
    if (_step == 2) {
      _goToSpots();
      return;
    }
    setState(() => _step = 0);
  }

  void _changeSlot() => setState(() => _step = 0);

  Future<void> _confirm() async {
    setState(() {
      _submitting = true;
      _submitError = null;
    });
    try {
      final booking = await bookingRepo.create(_draft);
      if (!mounted) return;
      HapticFeedback.mediumImpact();

      // The spot is held the moment the booking exists, so payment is offered
      // right after rather than gating it: backing out of the sheet leaves a
      // valid unpaid booking the driver can settle from Réservations.
      final paid = await showPaySheet(context, booking: booking);
      if (!mounted) return;
      await _showSuccess(paid ?? booking);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitError = e.toString();
        // Someone may have taken the spot in the meantime: going back must
        // show the grid as it is now, not as it was.
        _gridWindow = null;
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _showSuccess(Booking booking) async {
    final c = context.colors;
    final l = context.l10n;
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle, color: c.spotFree, size: 56),
            const AppGap(ApSpace.s4),
            Text(l.bookingConfirmed, style: Theme.of(dialogContext).textTheme.titleMedium),
            const AppGap(ApSpace.s2),
            Text(
              l.bookingConfirmedDetail(booking.spotNumber, booking.totalHours, mad(context, booking.totalPrice)),
              textAlign: TextAlign.center,
              style: Theme.of(dialogContext).textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          AppButton(
            label: l.bookingSeeReservations,
            expand: true,
            onPressed: () {
              Navigator.of(dialogContext).pop();
              context.go('/reservations');
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final steps = [l.bookingStepDetails, l.bookingStepSpot, l.bookingStepSummary];
    return Scaffold(
      appBar: AppBar(
        title: Text(_meta?.name ?? l.bookingTitle),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: _submitting ? null : _back),
      ),
      body: AsyncView(
        loading: _loading,
        error: _error,
        onRetry: _load,
        errorTitle: l.bookingLoadError,
        builder: (context) => Column(
          children: [
            _StepHeader(step: _step, labels: steps),
            Expanded(
              child: switch (_step) {
                0 => _DetailsStep(
                    formKey: _formKey,
                    plate: _plate,
                    start: _start,
                    end: _end,
                    pricePerHour: _pricePerHour,
                    draft: _draft,
                    onPickStart: () async {
                      final picked = await _pickDateTime(_start);
                      if (picked == null || !mounted) return;
                      setState(() {
                        // Keep the length of stay when the start moves, so a
                        // 2-hour slot stays 2 hours instead of inverting.
                        final length = _end.difference(_start);
                        _start = picked;
                        _end = picked.add(length > Duration.zero ? length : const Duration(hours: 1));
                      });
                    },
                    onPickEnd: () async {
                      final picked = await _pickDateTime(_end);
                      if (picked == null || !mounted) return;
                      setState(() => _end = picked);
                    },
                  ),
                1 => _SpotStep(
                    spots: _grid,
                    loading: _gridLoading,
                    error: _gridError,
                    start: _start,
                    end: _end,
                    selected: _spot,
                    onRetry: _loadSpots,
                    onChangeSlot: _changeSlot,
                    onSelect: (n) {
                      HapticFeedback.selectionClick();
                      setState(() => _spot = n);
                    },
                  ),
                _ => _SummaryStep(draft: _draft, meta: _meta, error: _submitError),
              },
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.all(ApSpace.s4),
                child: Row(
                  children: [
                    if (_step > 0) ...[
                      Expanded(
                        child: AppButton(
                          label: l.commonBack,
                          variant: AppButtonVariant.secondary,
                          onPressed: _submitting ? null : _back,
                          expand: true,
                        ),
                      ),
                      const AppGap(ApSpace.s3, axis: Axis.horizontal),
                    ],
                    Expanded(
                      flex: 2,
                      child: _step == 2
                          ? AppButton(
                              label: l.bookingConfirm,
                              icon: Icons.check,
                              loading: _submitting,
                              expand: true,
                              onPressed: _confirm,
                            )
                          : AppButton(
                              label: l.commonContinue,
                              icon: Icons.arrow_forward,
                              expand: true,
                              // Step 0 validates on tap, so typing a plate can
                              // never leave it stuck; step 1 needs a spot.
                              onPressed: (_step == 1 && (_spot == null || _gridLoading)) ? null : _next,
                            ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepHeader extends StatelessWidget {
  final int step;
  final List<String> labels;
  const _StepHeader({required this.step, required this.labels});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Padding(
      padding: const EdgeInsets.fromLTRB(ApSpace.s4, ApSpace.s4, ApSpace.s4, ApSpace.s2),
      child: Row(
        children: [
          for (var i = 0; i < labels.length; i++) ...[
            Expanded(
              child: Column(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    height: 4,
                    decoration: BoxDecoration(
                      color: i <= step ? c.primary : c.border,
                      borderRadius: BorderRadius.circular(ApRadius.full),
                    ),
                  ),
                  const AppGap(ApSpace.s2),
                  Text(
                    labels[i],
                    style: TextStyle(
                      fontSize: ApText.xs,
                      fontWeight: i == step ? ApWeight.semibold : ApWeight.regular,
                      color: i <= step ? c.primary : c.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            if (i < labels.length - 1) const AppGap(ApSpace.s2, axis: Axis.horizontal),
          ],
        ],
      ),
    );
  }
}


/// The slot the grid was computed for, with a way back to change it.
class _SlotBanner extends StatelessWidget {
  final DateTime start;
  final DateTime end;
  final VoidCallback onChange;

  const _SlotBanner({required this.start, required this.end, required this.onChange});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final fmt = DateFormat('EEE d MMM, HH:mm', l.localeName);
    // Each date is isolated so an Arabic sentence cannot reorder its parts.
    final range = '${isolate(fmt.format(start))} – ${isolate(fmt.format(end))}';
    return AppCard(
      background: c.primarySoft,
      child: Row(
        children: [
          Icon(Icons.schedule_rounded, color: c.primary, size: 20),
          const AppGap(ApSpace.s3, axis: Axis.horizontal),
          Expanded(child: Text(l.bookingForSlot(range), style: Theme.of(context).textTheme.bodySmall)),
          TextButton(onPressed: onChange, child: Text(l.bookingChangeSlot)),
        ],
      ),
    );
  }
}

class _SpotStep extends StatelessWidget {
  final List<Spot> spots;
  final bool loading;
  final Object? error;
  final DateTime start;
  final DateTime end;
  final int? selected;
  final VoidCallback onRetry;
  final VoidCallback onChangeSlot;
  final ValueChanged<int> onSelect;

  const _SpotStep({
    required this.spots,
    required this.loading,
    required this.error,
    required this.start,
    required this.end,
    required this.selected,
    required this.onRetry,
    required this.onChangeSlot,
    required this.onSelect,
  });

  static const _grid = SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 4,
    mainAxisSpacing: ApSpace.s3,
    crossAxisSpacing: ApSpace.s3,
    childAspectRatio: 1,
  );

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final banner = _SlotBanner(start: start, end: end, onChange: onChangeSlot);

    if (loading) {
      return ListView(
        padding: const EdgeInsets.all(ApSpace.s4),
        children: [
          banner,
          const AppGap(ApSpace.s5),
          const SkeletonBox(width: 180, height: 18),
          const AppGap(ApSpace.s2),
          const SkeletonBox(width: 120, height: 12),
          const AppGap(ApSpace.s5),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 12,
            gridDelegate: _grid,
            itemBuilder: (_, __) => const SkeletonBox(radius: ApRadius.md),
          ),
        ],
      );
    }
    if (error != null) {
      return ErrorStateView(error: error, title: l.bookingSpotsLoadError, onRetry: onRetry);
    }
    if (spots.isEmpty) {
      return EmptyState(
        icon: Icons.local_parking_outlined,
        title: l.bookingNoSpots,
        message: l.bookingNoSpotsHint,
      );
    }

    final free = spots.where((s) => s.isFree).length;
    if (free == 0) {
      return EmptyState(
        icon: Icons.event_busy_outlined,
        title: l.bookingSlotFull,
        message: l.bookingSlotFullHint,
        action: AppButton(
          label: l.bookingChangeSlot,
          icon: Icons.edit_calendar_outlined,
          variant: AppButtonVariant.secondary,
          onPressed: onChangeSlot,
        ),
      );
    }

    final c = context.colors;
    return ListView(
      padding: const EdgeInsets.all(ApSpace.s4),
      children: [
        banner,
        const AppGap(ApSpace.s5),
        Text(l.bookingSelectSpot, style: Theme.of(context).textTheme.titleMedium),
        const AppGap(ApSpace.s1),
        Text(l.bookingFreeOf(free, spots.length), style: Theme.of(context).textTheme.bodySmall),
        const AppGap(ApSpace.s4),
        Wrap(
          spacing: ApSpace.s3,
          runSpacing: ApSpace.s3,
          children: [
            _legend(context, c.spotFree, l.commonFree),
            _legend(context, c.spotReserved, l.legendReserved),
            _legend(context, c.spotOccupied, l.commonOccupied),
          ],
        ),
        const AppGap(ApSpace.s5),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: spots.length,
          gridDelegate: _grid,
          itemBuilder: (context, i) {
            final spot = spots[i];
            final isSelected = selected == spot.spotNumber;
            final (Color bg, Color fg, String state) = switch (spot.status) {
              SpotStatus.available => (c.spotFreeBg, c.spotFree, l.spotStateFree),
              SpotStatus.reserved => (c.spotReservedBg, c.spotReserved, l.spotStateReserved),
              SpotStatus.occupied => (c.spotOccupiedBg, c.spotOccupied, l.spotStateOccupied),
              SpotStatus.unknown => (c.spotBlockedBg, c.spotBlocked, l.spotStateUnavailable),
            };

            return Semantics(
              button: spot.isFree,
              selected: isSelected,
              label: l.spotSemantics(spot.spotNumber, state),
              child: GestureDetector(
                onTap: spot.isFree ? () => onSelect(spot.spotNumber) : null,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  decoration: BoxDecoration(
                    color: isSelected ? c.primary : bg,
                    borderRadius: BorderRadius.circular(ApRadius.md),
                    border: Border.all(
                      color: isSelected ? c.primary : fg.withValues(alpha: 0.35),
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${spot.spotNumber}',
                          style: TextStyle(
                            color: isSelected ? c.onPrimary : fg,
                            fontWeight: ApWeight.bold,
                            fontSize: ApText.lg,
                          ),
                        ),
                        // Not colour alone: taken spots say so.
                        if (!spot.isFree)
                          Icon(Icons.lock_outline, size: 12, color: fg),
                        if (isSelected) Icon(Icons.check, size: 14, color: c.onPrimary),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _legend(BuildContext context, Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const AppGap(ApSpace.s2, axis: Axis.horizontal),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _DetailsStep extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController plate;
  final DateTime start;
  final DateTime end;
  final double pricePerHour;
  final BookingDraft draft;
  final VoidCallback onPickStart;
  final VoidCallback onPickEnd;

  const _DetailsStep({
    required this.formKey,
    required this.plate,
    required this.start,
    required this.end,
    required this.pricePerHour,
    required this.draft,
    required this.onPickStart,
    required this.onPickEnd,
  });

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final fmt = DateFormat('EEE d MMM, HH:mm', l.localeName);
    return Form(
      key: formKey,
      child: ListView(
        padding: const EdgeInsets.all(ApSpace.s4),
        children: [
          Text(l.bookingSlot, style: Theme.of(context).textTheme.titleMedium),
          const AppGap(ApSpace.s1),
          Text(l.bookingSlotHint, style: Theme.of(context).textTheme.bodySmall),
          const AppGap(ApSpace.s3),
          _DateTimeTile(label: l.bookingStart, value: fmt.format(start), icon: Icons.play_arrow_rounded, onTap: onPickStart),
          const AppGap(ApSpace.s3),
          _DateTimeTile(label: l.bookingEnd, value: fmt.format(end), icon: Icons.stop_rounded, onTap: onPickEnd),
          const AppGap(ApSpace.s4),
          AppCard(
            background: context.colors.surfaceAlt,
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l.bookingBilled, style: Theme.of(context).textTheme.bodySmall),
                      Text(l.hoursShort(draft.billableHours), style: Theme.of(context).textTheme.titleSmall),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(l.bookingEstimate, style: Theme.of(context).textTheme.bodySmall),
                    Text(
                      mad(context, draft.estimatedPrice),
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const AppGap(ApSpace.s2),
          Text(
            l.bookingPriceNote,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const AppGap(ApSpace.s6),
          Text(l.bookingVehicle, style: Theme.of(context).textTheme.titleMedium),
          const AppGap(ApSpace.s3),
          TextFormField(
            controller: plate,
            textCapitalization: TextCapitalization.characters,
            decoration: InputDecoration(labelText: l.fieldPlate, hintText: l.plateHint),
            // Plates are written left to right, even inside an Arabic form.
            textDirection: TextDirection.ltr,
            validator: (v) {
              final value = (v ?? '').trim();
              if (value.length < 4) return l.plateRequired;
              return null;
            },
          ),
        ],
      ),
    );
  }
}

class _DateTimeTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final VoidCallback onTap;

  const _DateTimeTile({required this.label, required this.value, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return AppCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: c.primarySoft, borderRadius: BorderRadius.circular(ApRadius.sm)),
            child: Icon(icon, color: c.primary, size: 20),
          ),
          const AppGap(ApSpace.s3, axis: Axis.horizontal),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: Theme.of(context).textTheme.bodySmall),
                Text(value, style: Theme.of(context).textTheme.titleSmall),
              ],
            ),
          ),
          Icon(Icons.edit_calendar_outlined, color: c.textMuted, size: 20),
        ],
      ),
    );
  }
}

class _SummaryStep extends StatelessWidget {
  final BookingDraft draft;
  final Parking? meta;
  final String? error;

  const _SummaryStep({required this.draft, required this.meta, this.error});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final fmt = DateFormat('EEE d MMM, HH:mm', l.localeName);

    return ListView(
      padding: const EdgeInsets.all(ApSpace.s4),
      children: [
        if (error != null) ...[
          Container(
            padding: const EdgeInsets.all(ApSpace.s3),
            decoration: BoxDecoration(color: c.spotOccupiedBg, borderRadius: BorderRadius.circular(ApRadius.md)),
            child: Row(
              children: [
                Icon(Icons.error_outline, color: c.spotOccupied, size: 18),
                const AppGap(ApSpace.s2, axis: Axis.horizontal),
                Expanded(child: Text(error!, style: TextStyle(color: c.spotOccupied, fontSize: ApText.sm))),
              ],
            ),
          ),
          const AppGap(ApSpace.s4),
        ],
        AppCard(
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(child: Text(draft.parkingName, style: Theme.of(context).textTheme.titleMedium)),
                  if (meta != null)
                    StatusBadge(
                      label: meta!.isStreet ? l.parkingTypeStreet : l.parkingTypeNormalShort,
                      tone: meta!.isStreet ? AppTone.street : AppTone.normal,
                      dot: true,
                    ),
                ],
              ),
              const AppGap(ApSpace.s4),
              _row(context, l.bookingStepSpot, l.spotNumber(draft.spotNumber)),
              _row(context, l.bookingPlate, isolate(draft.carPlate)),
              _row(context, l.bookingStart, fmt.format(draft.start)),
              _row(context, l.bookingEnd, fmt.format(draft.end)),
              _row(context, l.bookingBilled, l.hoursShort(draft.billableHours)),
              _row(context, l.sheetHourly, mad(context, draft.pricePerHour)),
              Divider(height: ApSpace.s6, color: c.border),
              Row(
                children: [
                  Expanded(child: Text(l.bookingTotal, style: Theme.of(context).textTheme.titleSmall)),
                  Text(
                    mad(context, draft.estimatedPrice),
                    style: TextStyle(fontSize: ApText.xl2, fontWeight: ApWeight.bold, color: c.primary),
                  ),
                ],
              ),
            ],
          ),
        ),
        const AppGap(ApSpace.s4),
        Row(
          children: [
            Icon(Icons.info_outline, size: 16, color: c.textMuted),
            const AppGap(ApSpace.s2, axis: Axis.horizontal),
            Expanded(
              child: Text(
                l.bookingCancelNote,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _row(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: ApSpace.s1 + 2),
      child: Row(
        children: [
          Expanded(child: Text(label, style: Theme.of(context).textTheme.bodySmall)),
          Text(value, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}
