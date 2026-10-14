import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
// intl has its own TextDirection; the widgets need Flutter's.
import 'package:intl/intl.dart' hide TextDirection;

import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../repositories/repositories.dart';
import '../../widgets/widgets.dart';

class StreetsScreen extends StatefulWidget {
  const StreetsScreen({super.key});

  @override
  State<StreetsScreen> createState() => _StreetsScreenState();
}

class _StreetsScreenState extends State<StreetsScreen> {
  final _search = TextEditingController();
  List<StreetParking> _streets = [];
  bool _loading = true;
  Object? _error;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
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
      final list = await technicianRepo.streets();
      if (!mounted) return;
      setState(() {
        _streets = list;
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

  List<StreetParking> get _visible {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return _streets;
    return _streets
        .where((s) => s.name.toLowerCase().contains(q) || s.address.toLowerCase().contains(q))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l.streetsTitle)),
      body: RefreshIndicator(
        onRefresh: () => _load(silent: true),
        child: AsyncView(
          loading: _loading,
          error: _error,
          onRetry: _load,
          isEmpty: _streets.isEmpty,
          emptyIcon: Icons.add_road,
          emptyTitle: l.streetsEmpty,
          emptyMessage: l.streetsEmptyHint,
          builder: (context) => ListView(
            padding: const EdgeInsets.all(ApSpace.s4),
            children: [
              TextField(
                controller: _search,
                onChanged: (v) => setState(() => _query = v),
                decoration: InputDecoration(
                  hintText: l.streetsSearch,
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _query.isEmpty
                      ? null
                      : IconButton(
                          icon: const Icon(Icons.close),
                          tooltip: l.commonClear,
                          onPressed: () {
                            _search.clear();
                            setState(() => _query = '');
                          },
                        ),
                ),
              ),
              const AppGap(ApSpace.s4),
              if (_visible.isEmpty)
                AppCard(
                  child: Text(l.streetsNoResult(_query), style: Theme.of(context).textTheme.bodySmall),
                )
              else
                for (final street in _visible) ...[
                  _StreetTile(
                    street: street,
                    onTap: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => StreetSpotsScreen(street: street)),
                      );
                      if (mounted) _load(silent: true);
                    },
                  ),
                  const AppGap(ApSpace.s3),
                ],
            ],
          ),
        ),
      ),
    );
  }
}

class _StreetTile extends StatelessWidget {
  final StreetParking street;
  final VoidCallback onTap;

  const _StreetTile({required this.street, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final occupancy = street.occupancy;
    final tone = street.availableSpots == 0
        ? c.spotOccupied
        : (occupancy > 0.75 ? c.spotReserved : c.spotFree);

    return AppCard(
      onTap: onTap,
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(color: c.accentSoft, borderRadius: BorderRadius.circular(ApRadius.sm)),
                child: Icon(Icons.add_road, color: c.parkingStreet, size: 20),
              ),
              const AppGap(ApSpace.s3, axis: Axis.horizontal),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(street.name, style: Theme.of(context).textTheme.titleSmall),
                    if (street.address.isNotEmpty)
                      Text(street.address, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: c.textMuted),
            ],
          ),
          const AppGap(ApSpace.s3),
          // Availability at a glance, not just a number.
          ClipRRect(
            borderRadius: BorderRadius.circular(ApRadius.full),
            child: LinearProgressIndicator(
              value: occupancy,
              minHeight: 8,
              backgroundColor: c.surfaceAlt,
              valueColor: AlwaysStoppedAnimation(tone),
            ),
          ),
          const AppGap(ApSpace.s2),
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: Text(
              context.l10n.streetsStats(
                street.availableSpots,
                street.totalSpots - street.availableSpots,
                street.totalSpots,
              ),
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }
}

/// Spot view for one street.
///
/// A real route rather than in-page state, so the hardware back button
/// returns to the list instead of leaving the technician area.
class StreetSpotsScreen extends StatefulWidget {
  final StreetParking street;
  const StreetSpotsScreen({super.key, required this.street});

  @override
  State<StreetSpotsScreen> createState() => _StreetSpotsScreenState();
}

class _StreetSpotsScreenState extends State<StreetSpotsScreen> {
  List<StreetSpot> _spots = [];
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
      final spots = await technicianRepo.spots(widget.street.id);
      if (!mounted) return;
      setState(() {
        _spots = spots;
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

  Future<void> _fine(StreetSpot spot) async {
    final issued = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _FineSheet(street: widget.street, spot: spot),
    );
    if (issued == true && mounted) {
      // The list used to stay stale, making duplicate fines easy.
      _load(silent: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final fmt = DateFormat('HH:mm', l.localeName);

    return Scaffold(
      appBar: AppBar(title: Text(widget.street.name)),
      body: RefreshIndicator(
        onRefresh: () => _load(silent: true),
        child: AsyncView(
          loading: _loading,
          error: _error,
          onRetry: _load,
          isEmpty: _spots.isEmpty,
          emptyTitle: l.bookingNoSpots,
          builder: (context) => ListView(
            padding: const EdgeInsets.all(ApSpace.s4),
            children: [
              for (final spot in _spots) ...[
                AppCard(
                  onTap: spot.isFree ? null : () => _fine(spot),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: spot.isFree ? c.spotFreeBg : (spot.isOverstay ? c.spotOverstayBg : c.spotOccupiedBg),
                          borderRadius: BorderRadius.circular(ApRadius.sm),
                        ),
                        child: Center(
                          child: Text(
                            '${spot.spotNumber}',
                            style: TextStyle(
                              fontWeight: ApWeight.bold,
                              color: spot.isFree ? c.spotFree : (spot.isOverstay ? c.spotOverstay : c.spotOccupied),
                            ),
                          ),
                        ),
                      ),
                      const AppGap(ApSpace.s3, axis: Axis.horizontal),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              spot.isFree ? l.spotFreeTitle : (spot.carPlate != null ? isolate(spot.carPlate) : l.commonOccupied),
                              style: Theme.of(context).textTheme.titleSmall,
                            ),
                            if (!spot.isFree && spot.endTime != null)
                              Text(
                                spot.isOverstay
                                    ? l.spotOverstaySince(fmt.format(spot.endTime!))
                                    : l.spotUntil(fmt.format(spot.endTime!)),
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                          ],
                        ),
                      ),
                      if (spot.isOverstay)
                        StatusBadge(label: l.badgeFine, tone: AppTone.overstay, icon: Icons.gavel_rounded)
                      else if (!spot.isFree)
                        StatusBadge(label: l.commonOccupied, tone: AppTone.occupied)
                      else
                        StatusBadge(label: l.commonFree, tone: AppTone.free),
                    ],
                  ),
                ),
                const AppGap(ApSpace.s3),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _FineSheet extends StatefulWidget {
  final StreetParking street;
  final StreetSpot spot;

  const _FineSheet({required this.street, required this.spot});

  @override
  State<_FineSheet> createState() => _FineSheetState();
}

class _FineSheetState extends State<_FineSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _plate;
  final _reason = TextEditingController();
  bool _sending = false;
  XFile? _photo;


  @override
  void initState() {
    super.initState();
    // Prefilled from the active booking; the old form always passed an empty
    // plate and dropped the spot number entirely.
    _plate = TextEditingController(text: widget.spot.carPlate ?? '');
  }

  @override
  void dispose() {
    _plate.dispose();
    _reason.dispose();
    super.dispose();
  }

  /// Camera only, never the gallery: evidence has to be taken on the spot.
  /// Downscaled before upload — a plate stays legible at 1600 px, and a
  /// 12 MP original over mobile data is a long wait at the kerb.
  Future<void> _takePhoto() async {
    try {
      final shot = await ImagePicker().pickImage(
        source: ImageSource.camera,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 80,
      );
      if (shot == null || !mounted) return;
      setState(() => _photo = shot);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.finePhotoFailed)));
    }
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final l = context.l10n;
    setState(() => _sending = true);
    try {
      await technicianRepo.issueFine(
        streetParkingId: widget.street.id,
        carPlate: _plate.text.trim().toUpperCase(),
        reason: _reason.text.trim(),
        spotNumber: widget.spot.spotNumber,
        photoPath: _photo?.path,
      );
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_photo != null ? l.fineIssuedWithPhoto : l.fineIssued)),
      );
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final reasons = [l.fineReasonOverstay, l.fineReasonNoBooking, l.fineReasonObstruction];
    return Padding(
      padding: EdgeInsets.only(
        left: ApSpace.s5,
        right: ApSpace.s5,
        top: ApSpace.s5,
        bottom: MediaQuery.viewInsetsOf(context).bottom + ApSpace.s5,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l.fineTitle, style: Theme.of(context).textTheme.titleMedium),
            const AppGap(ApSpace.s1),
            Text(
              l.fineSubtitle(widget.street.name, widget.spot.spotNumber),
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const AppGap(ApSpace.s4),
            TextFormField(
              controller: _plate,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(labelText: l.finePlate, hintText: l.plateHint),
              textDirection: TextDirection.ltr,
              validator: (v) => (v ?? '').trim().length < 4 ? l.finePlateRequired : null,
            ),
            const AppGap(ApSpace.s3),
            Wrap(
              spacing: ApSpace.s2,
              children: [
                for (final r in reasons)
                  ActionChip(label: Text(r), onPressed: () => setState(() => _reason.text = r)),
              ],
            ),
            const AppGap(ApSpace.s3),
            TextFormField(
              controller: _reason,
              maxLines: 2,
              decoration: InputDecoration(labelText: l.fineReason),
              validator: (v) => (v ?? '').trim().length < 5 ? l.fineReasonRequired : null,
            ),
            const AppGap(ApSpace.s4),
            _PhotoField(
              photo: _photo,
              onTake: _sending ? null : _takePhoto,
              onRemove: _sending ? null : () => setState(() => _photo = null),
            ),
            const AppGap(ApSpace.s5),
            AppButton(
              label: l.fineSubmit,
              icon: Icons.gavel_rounded,
              variant: AppButtonVariant.danger,
              loading: _sending,
              expand: true,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}

/// Optional photo of the plate, attached to the fine as evidence.
class _PhotoField extends StatelessWidget {
  final XFile? photo;
  final VoidCallback? onTake;
  final VoidCallback? onRemove;

  const _PhotoField({required this.photo, required this.onTake, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final c = context.colors;

    if (photo == null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          OutlinedButton.icon(
            onPressed: onTake,
            icon: const Icon(Icons.photo_camera_outlined),
            label: Text(l.fineAddPhoto),
          ),
          const AppGap(ApSpace.s1),
          Text(l.finePhotoHint, style: TextStyle(fontSize: ApText.xs, color: c.textMuted)),
        ],
      );
    }

    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(ApRadius.md),
          child: Image.file(File(photo!.path), width: 88, height: 66, fit: BoxFit.cover),
        ),
        const AppGap(ApSpace.s3, axis: Axis.horizontal),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l.finePhoto, style: Theme.of(context).textTheme.titleSmall),
              Wrap(
                spacing: ApSpace.s1,
                children: [
                  TextButton(onPressed: onTake, child: Text(l.fineRetakePhoto)),
                  TextButton(
                    onPressed: onRemove,
                    child: Text(l.fineRemovePhoto, style: TextStyle(color: c.danger)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
