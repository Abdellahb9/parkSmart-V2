import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../core/api_service.dart';
import '../../core/constants.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});
  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  List<dynamic> _parkings = [];
  List<Marker> _markers = [];
  dynamic _selectedParking;
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _loadParkings();
  }

  Future<void> _loadParkings() async {
    try {
      final data = await ApiService.get('/parkings');
      if (!mounted) return;
      setState(() {
        _parkings = List.from(data);
        _markers = _parkings
            .where((p) => p['type'] == 'normal')
            .map((p) {
          final coords = p['location']['coordinates'];
          return Marker(
            point: LatLng(coords[1].toDouble(), coords[0].toDouble()),
            width: 40,
            height: 40,
            child: GestureDetector(
              onTap: () => setState(() => _selectedParking = p),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 4)],
                ),
                child: const Icon(Icons.local_parking, color: Colors.white, size: 20),
              ),
            ),
          );
        }).toList();
      });
    } catch (e) {
      debugPrint('Error loading parkings: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: const LatLng(ApiConfig.defaultLat, ApiConfig.defaultLng),
              initialZoom: ApiConfig.defaultZoom,
              onTap: (_, __) => setState(() => _selectedParking = null),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.autopark.mobile',
              ),
              MarkerLayer(markers: _markers),
            ],
          ),

          // Search bar
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, 2))],
              ),
              child: const TextField(
                decoration: InputDecoration(
                  hintText: 'Rechercher un parking...',
                  border: InputBorder.none,
                  icon: Icon(Icons.search, color: AppColors.primary),
                ),
              ),
            ),
          ),

          // Parking preview card
          if (_selectedParking != null)
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 15, offset: const Offset(0, -2))],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            _selectedParking['name'],
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => setState(() => _selectedParking = null),
                          child: const Icon(Icons.close, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(_selectedParking['address'] ?? '', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _infoChip(Icons.local_parking, '${_selectedParking['availableSpots']} / ${_selectedParking['totalSpots']}', AppColors.success),
                        const SizedBox(width: 12),
                        _infoChip(Icons.attach_money, '${_selectedParking['pricePerHour']} MAD/h', AppColors.primary),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => context.push('/booking/spots/${_selectedParking['_id']}'),
                        child: const Text('Réserver une place'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _infoChip(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(text, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }
}
