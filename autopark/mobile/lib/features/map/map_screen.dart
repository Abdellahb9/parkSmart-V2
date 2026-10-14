import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../core/constants.dart';
import 'package:provider/provider.dart';

import '../../core/location_service.dart';
import '../../core/realtime_service.dart';
import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../repositories/repositories.dart';
import '../../widgets/widgets.dart';
import 'widgets/parking_sheet.dart';

enum _Filter { all, normal, street, available }

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final _mapController = MapController();
  final _searchController = TextEditingController();
  final _searchFocus = FocusNode();

  List<Parking> _parkings = [];
  bool _loading = true;
  Object? _error;
  String _query = '';
  _Filter _filter = _Filter.all;
  LatLng? _userPosition;
  bool _locating = false;

  @override
  void initState() {
    super.initState();
    _load();
    // Live availability; silently does nothing if the socket cannot connect.
    context.read<RealtimeService>().connect();
  }

  @override
  void dispose() {
    _mapController.dispose();
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await parkingRepo.list();
      if (!mounted) return;
      setState(() {
        _parkings = list;
        _loading = false;
      });
      if (!mounted) return;
      context.read<RealtimeService>().subscribe(list.map((p) => p.id).toList());
    } catch (e) {
      if (!mounted) return;
      // Previously this was a debugPrint, leaving a permanently empty map
      // that looked identical to "there are no parkings".
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  List<Parking> get _visible {
    final q = _query.trim().toLowerCase();
    return _parkings.where((p) {
      if (!p.hasPosition) return false;
      if (_filter == _Filter.normal && p.isStreet) return false;
      if (_filter == _Filter.street && !p.isStreet) return false;
      if (_filter == _Filter.available && !p.hasFreeSpots) return false;
      if (q.isEmpty) return true;
      return p.name.toLowerCase().contains(q) || p.address.toLowerCase().contains(q);
    }).toList();
  }

  List<Parking> get _suggestions {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return const [];
    return _visible.take(5).toList();
  }

  void _focusOn(Parking p) {
    _searchFocus.unfocus();
    _mapController.move(LatLng(p.latitude, p.longitude), 16);
    _openSheet(p);
  }

  Future<void> _openSheet(Parking parking) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ParkingSheet(
        parking: parking,
        onReserve: () {
          Navigator.of(context).pop();
          context.push('/booking/${parking.id}');
        },
      ),
    );
  }

  Future<void> _locateMe() async {
    setState(() => _locating = true);
    try {
      final position = await LocationService.current();
      if (!mounted) return;
      final here = LatLng(position.latitude, position.longitude);
      setState(() => _userPosition = here);
      _mapController.move(here, 15);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final visible = _visible;
    // Server-pushed counts win over the ones fetched at page load.
    final rt = context.watch<RealtimeService>();
    final live = rt.availability;
    int availableOf(Parking p) => live[p.id] ?? p.availableSpots;

    return Scaffold(
      body: AsyncView(
        loading: _loading,
        error: _error,
        onRetry: _load,
        errorTitle: l.mapLoadError,
        loadingWidget: const Center(child: CircularProgressIndicator()),
        builder: (context) => Stack(
          children: [
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: const LatLng(ApiConfig.defaultLat, ApiConfig.defaultLng),
                initialZoom: ApiConfig.defaultZoom,
                onTap: (_, __) => _searchFocus.unfocus(),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.autopark.mobile',
                ),
                if (_userPosition != null)
                  CircleLayer(
                    circles: [
                      CircleMarker(
                        point: _userPosition!,
                        radius: 10,
                        useRadiusInMeter: false,
                        color: c.primary.withValues(alpha: 0.25),
                        borderColor: c.primary,
                        borderStrokeWidth: 2,
                      ),
                    ],
                  ),
                MarkerLayer(
                  markers: [
                    for (final p in visible)
                      Marker(
                        point: LatLng(p.latitude, p.longitude),
                        width: 54,
                        height: 54,
                        child: _ParkingMarker(parking: p, available: availableOf(p), onTap: () => _openSheet(p)),
                      ),
                  ],
                ),
              ],
            ),

            // Search + filters
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(ApSpace.s3),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SearchField(
                      controller: _searchController,
                      focusNode: _searchFocus,
                      onChanged: (v) => setState(() => _query = v),
                      onClear: () {
                        _searchController.clear();
                        setState(() => _query = '');
                      },
                    ),
                    if (_suggestions.isNotEmpty && _searchFocus.hasFocus) ...[
                      const AppGap(ApSpace.s2),
                      AppCard(
                        padding: EdgeInsets.zero,
                        child: Column(
                          children: [
                            for (final p in _suggestions)
                              ListTile(
                                dense: true,
                                leading: Icon(
                                  p.isStreet ? Icons.add_road : Icons.local_parking,
                                  color: p.isStreet ? c.parkingStreet : c.parkingNormal,
                                ),
                                title: Text(p.name, style: Theme.of(context).textTheme.bodyMedium),
                                subtitle: Text(
                                  l.mapFreeOf(availableOf(p), p.totalSpots),
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                onTap: () => _focusOn(p),
                              ),
                          ],
                        ),
                      ),
                    ],
                    const AppGap(ApSpace.s2),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _chip(l.mapFilterAll, _Filter.all),
                          _chip(l.mapFilterParkings, _Filter.normal),
                          _chip(l.mapFilterStreet, _Filter.street),
                          _chip(l.mapFilterAvailable, _Filter.available),
                        ],
                      ),
                    ),
                    if (rt.connected) ...[
                      const AppGap(ApSpace.s2),
                      const _LiveChip(),
                    ],
                  ],
                ),
              ),
            ),

            // Empty result is a real state, not a silently blank map.
            if (visible.isEmpty)
              Center(
                child: AppCard(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.search_off, color: c.textMuted),
                      const AppGap(ApSpace.s2),
                      Text(l.mapNoMatch, style: Theme.of(context).textTheme.titleSmall),
                      const AppGap(ApSpace.s1),
                      Text(l.mapNoMatchHint, style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
      floatingActionButton: _loading || _error != null
          ? null
          : Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                FloatingActionButton.small(
                  heroTag: 'refresh',
                  onPressed: _load,
                  tooltip: l.mapRefresh,
                  backgroundColor: c.surface,
                  foregroundColor: c.text,
                  child: const Icon(Icons.refresh),
                ),
                const AppGap(ApSpace.s2),
                FloatingActionButton(
                  heroTag: 'locate',
                  onPressed: _locating ? null : _locateMe,
                  tooltip: l.mapLocate,
                  child: _locating
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.my_location),
                ),
              ],
            ),
    );
  }

  Widget _chip(String label, _Filter value) {
    final selected = _filter == value;
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: ApSpace.s2),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => setState(() => _filter = value),
        showCheckmark: false,
        backgroundColor: context.colors.surface,
        selectedColor: context.colors.primarySoft,
      ),
    );
  }
}

/// Shown only while the socket is up, so the counts on screen are known to be
/// server-pushed rather than fetched at page load.
class _LiveChip extends StatelessWidget {
  const _LiveChip();

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: ApSpace.s3, vertical: ApSpace.s1),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(ApRadius.full),
        border: Border.all(color: c.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: c.spotFree, shape: BoxShape.circle),
          ),
          const AppGap(ApSpace.s2, axis: Axis.horizontal),
          Text(
            context.l10n.mapLive,
            style: TextStyle(fontSize: ApText.xs, color: c.textMuted, fontWeight: ApWeight.medium),
          ),
        ],
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;

  const _SearchField({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Material(
      elevation: 2,
      borderRadius: BorderRadius.circular(ApRadius.lg),
      shadowColor: Colors.black26,
      child: TextField(
        // Previously a `const TextField` with no controller: the most
        // prominent control on the home screen did nothing at all.
        controller: controller,
        focusNode: focusNode,
        onChanged: onChanged,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: context.l10n.mapSearchHint,
          prefixIcon: Icon(Icons.search, color: c.primary),
          suffixIcon: controller.text.isEmpty
              ? null
              : IconButton(icon: const Icon(Icons.close), tooltip: context.l10n.commonClear, onPressed: onClear),
          filled: true,
          fillColor: c.surface,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(ApRadius.lg),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(ApRadius.lg),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }
}

/// Disc coloured by parking type, ring by occupancy, with the number of free
/// spots written inside so the state is never colour-only.
class _ParkingMarker extends StatelessWidget {
  final Parking parking;
  final int available;
  final VoidCallback onTap;

  const _ParkingMarker({required this.parking, required this.available, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final ratio = parking.totalSpots == 0 ? 0.0 : (parking.totalSpots - available) / parking.totalSpots;
    final ring = available == 0 ? c.spotOccupied : (ratio > 0.75 ? c.spotReserved : c.spotFree);

    return Semantics(
      button: true,
      label: context.l10n.mapMarkerSemantics(parking.name, available, parking.totalSpots),
      child: GestureDetector(
        onTap: onTap,
        child: Center(
          child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: parking.isStreet ? c.parkingStreet : c.parkingNormal,
              shape: BoxShape.circle,
              border: Border.all(color: ring, width: 3),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 6)],
            ),
            child: Center(
              child: Text(
                '$available',
                style: const TextStyle(color: Colors.white, fontWeight: ApWeight.bold, fontSize: ApText.sm),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
