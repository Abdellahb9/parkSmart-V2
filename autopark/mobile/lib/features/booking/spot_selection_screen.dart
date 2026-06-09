import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_service.dart';
import '../../core/constants.dart';

class SpotSelectionScreen extends StatefulWidget {
  final String parkingId;
  const SpotSelectionScreen({super.key, required this.parkingId});
  @override
  State<SpotSelectionScreen> createState() => _SpotSelectionScreenState();
}

class _SpotSelectionScreenState extends State<SpotSelectionScreen> {
  Map<String, dynamic>? _parking;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSpots();
  }

  Future<void> _loadSpots() async {
    try {
      final data = await ApiService.get('/parkings/${widget.parkingId}/spots');
      setState(() { _parking = Map<String, dynamic>.from(data); _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_parking?['name'] ?? 'Choisir une place')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _parking == null
              ? const Center(child: Text('Erreur de chargement'))
              : Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Sélectionnez une place', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      // Legend
                      Row(
                        children: [
                          _legendDot(AppColors.success, 'Disponible'),
                          const SizedBox(width: 16),
                          _legendDot(AppColors.danger, 'Occupée'),
                          const SizedBox(width: 16),
                          _legendDot(AppColors.warning, 'Réservée'),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Expanded(
                        child: GridView.builder(
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 5,
                            mainAxisSpacing: 10,
                            crossAxisSpacing: 10,
                          ),
                          itemCount: (_parking!['spots'] as List).length,
                          itemBuilder: (context, index) {
                            final spot = _parking!['spots'][index];
                            final status = spot['status'];
                            final isAvailable = status == 'available';

                            Color bgColor;
                            if (status == 'available') {
                              bgColor = AppColors.success;
                            } else if (status == 'reserved') {
                              bgColor = AppColors.warning;
                            } else {
                              bgColor = AppColors.danger;
                            }

                            return GestureDetector(
                              onTap: isAvailable
                                  ? () => context.push('/booking/details/${widget.parkingId}/${spot['spotNumber']}')
                                  : null,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: bgColor.withValues(alpha: isAvailable ? 1 : 0.5),
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: isAvailable ? [BoxShadow(color: bgColor.withValues(alpha: 0.3), blurRadius: 6)] : null,
                                ),
                                child: Center(
                                  child: Text(
                                    '${spot['spotNumber']}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      ],
    );
  }
}
