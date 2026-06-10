import 'package:flutter/material.dart';
import '../../core/api_service.dart';
import '../../core/constants.dart';

class StreetsScreen extends StatefulWidget {
  const StreetsScreen({super.key});
  @override
  State<StreetsScreen> createState() => _StreetsScreenState();
}

class _StreetsScreenState extends State<StreetsScreen> {
  List<dynamic> _streets = [];
  bool _loading = true;
  dynamic _selectedStreet;
  List<dynamic> _spots = [];
  bool _loadingSpots = false;

  @override
  void initState() {
    super.initState();
    _loadStreets();
  }

  Future<void> _loadStreets() async {
    try {
      final data = await ApiService.get('/technicien/streets');
      setState(() { _streets = List.from(data); _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadStreetSpots(String id) async {
    setState(() => _loadingSpots = true);
    try {
      final data = await ApiService.get('/technicien/streets/$id/spots');
      setState(() { _spots = List.from(data['spots']); _loadingSpots = false; });
    } catch (e) {
      setState(() => _loadingSpots = false);
    }
  }

  Future<void> _issueFine(String carPlate, int spotNumber) async {
    final plateController = TextEditingController(text: carPlate);
    final reasonController = TextEditingController(text: 'Stationnement sans réservation');

    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Émettre une amende'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: plateController, decoration: const InputDecoration(labelText: 'Plaque d\'immatriculation')),
            const SizedBox(height: 12),
            TextField(controller: reasonController, decoration: const InputDecoration(labelText: 'Raison'), maxLines: 2),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Émettre l\'amende'),
          ),
        ],
      ),
    );

    if (result == true && _selectedStreet != null) {
      try {
        await ApiService.post('/technicien/fines', {
          'streetParkingId': _selectedStreet['_id'],
          'carPlate': plateController.text.trim(),
          'reason': reasonController.text.trim(),
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Amende émise'), backgroundColor: AppColors.success),
          );
        }
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Parkings voie publique')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _selectedStreet == null
              ? _buildStreetsList()
              : _buildSpotsList(),
    );
  }

  Widget _buildStreetsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _streets.length,
      itemBuilder: (context, index) {
        final s = _streets[index];
        return GestureDetector(
          onTap: () {
            setState(() => _selectedStreet = s);
            _loadStreetSpots(s['_id']);
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6)],
            ),
            child: Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.add_road, color: AppColors.accentDark),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s['name'], style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      Text('${s['totalSpots']} places • ${s['availableSpots']} disponibles', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppColors.textSecondary),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSpotsList() {
    return Column(
      children: [
        // Back button + title
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              IconButton(
                onPressed: () => setState(() { _selectedStreet = null; _spots = []; }),
                icon: const Icon(Icons.arrow_back),
              ),
              Text(_selectedStreet['name'], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            ],
          ),
        ),

        if (_loadingSpots)
          const Expanded(child: Center(child: CircularProgressIndicator()))
        else
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _spots.length,
              itemBuilder: (context, index) {
                final spot = _spots[index];
                final booking = spot['booking'];
                final hasBooking = booking != null;

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: hasBooking ? AppColors.success.withValues(alpha: 0.3) : AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 42, height: 42,
                        decoration: BoxDecoration(
                          color: hasBooking ? AppColors.success.withValues(alpha: 0.1) : AppColors.textSecondary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Center(child: Text('${spot['spotNumber']}', style: TextStyle(fontWeight: FontWeight.w700, color: hasBooking ? AppColors.success : AppColors.textSecondary))),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: hasBooking
                            ? Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(booking['carPlate'], style: const TextStyle(fontWeight: FontWeight.w700)),
                                  const Text('Réservé', style: TextStyle(fontSize: 12, color: AppColors.success)),
                                ],
                              )
                            : const Text('VIDE', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                      ),
                      if (!hasBooking)
                        ElevatedButton.icon(
                          onPressed: () => _issueFine('', spot['spotNumber']),
                          icon: const Icon(Icons.gavel, size: 16),
                          label: const Text('Amende'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.danger,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            textStyle: const TextStyle(fontSize: 12),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}
