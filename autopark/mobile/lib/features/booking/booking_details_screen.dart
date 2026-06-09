import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/auth_provider.dart';
import '../../core/api_service.dart';
import '../../core/constants.dart';

class BookingDetailsScreen extends StatefulWidget {
  final String parkingId;
  final int spotNumber;
  const BookingDetailsScreen({super.key, required this.parkingId, required this.spotNumber});
  @override
  State<BookingDetailsScreen> createState() => _BookingDetailsScreenState();
}

class _BookingDetailsScreenState extends State<BookingDetailsScreen> {
  final _carPlateController = TextEditingController();
  TimeOfDay _startTime = TimeOfDay.now();
  TimeOfDay _endTime = TimeOfDay(hour: TimeOfDay.now().hour + 2, minute: 0);
  Map<String, dynamic>? _parking;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadParking();
  }

  Future<void> _loadParking() async {
    try {
      final data = await ApiService.get('/parkings/${widget.parkingId}');
      setState(() { _parking = Map<String, dynamic>.from(data); _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  int get _totalHours {
    final start = _startTime.hour * 60 + _startTime.minute;
    final end = _endTime.hour * 60 + _endTime.minute;
    final diff = end - start;
    return diff > 0 ? (diff / 60).ceil() : 1;
  }

  double get _totalPrice => _totalHours.toDouble() * (_parking?['pricePerHour'] ?? 0).toDouble();

  Future<void> _pickTime(bool isStart) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isStart ? _startTime : _endTime,
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startTime = picked;
        } else {
          _endTime = picked;
        }
      });
    }
  }

  void _goToConfirm() {
    final auth = context.read<AuthProvider>();
    final now = DateTime.now();
    final startDateTime = DateTime(now.year, now.month, now.day, _startTime.hour, _startTime.minute);
    final endDateTime = DateTime(now.year, now.month, now.day, _endTime.hour, _endTime.minute);

    context.push('/booking/confirm', extra: {
      'parkingId': widget.parkingId,
      'parkingName': _parking?['name'] ?? '',
      'spotNumber': widget.spotNumber,
      'carPlate': _carPlateController.text.trim(),
      'startTime': startDateTime.toIso8601String(),
      'endTime': endDateTime.toIso8601String(),
      'totalHours': _totalHours,
      'totalPrice': _totalPrice,
      'userName': auth.user?['fullName'] ?? '',
      'userEmail': auth.user?['email'] ?? '',
      'userPhone': auth.user?['phone'] ?? '',
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Détails de réservation')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Spot info
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 56, height: 56,
                          decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(12)),
                          child: Center(child: Text('${widget.spotNumber}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 22))),
                        ),
                        const SizedBox(width: 14),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_parking?['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                            Text('Place n°${widget.spotNumber}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Auto-filled user info
                  const Text('Vos informations', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 12),
                  _readOnlyField('Nom complet', auth.user?['fullName'] ?? ''),
                  _readOnlyField('Email', auth.user?['email'] ?? ''),
                  _readOnlyField('Téléphone', auth.user?['phone'] ?? ''),
                  const SizedBox(height: 8),

                  // Car plate
                  TextField(
                    controller: _carPlateController,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(labelText: 'Plaque d\'immatriculation', prefixIcon: Icon(Icons.directions_car_outlined)),
                  ),
                  const SizedBox(height: 24),

                  // Time picker
                  const Text('Horaire', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _timeButton('De', _startTime, () => _pickTime(true))),
                      const SizedBox(width: 12),
                      Expanded(child: _timeButton('À', _endTime, () => _pickTime(false))),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Price summary
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.accent.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('$_totalHours heure(s) × ${_parking?['pricePerHour']} MAD', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                            const SizedBox(height: 4),
                            const Text('Total', style: TextStyle(fontWeight: FontWeight.w600)),
                          ],
                        ),
                        Text('${_totalPrice.toStringAsFixed(0)} MAD', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.primary)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _carPlateController.text.trim().isEmpty ? null : _goToConfirm,
                      child: const Text('Continuer'),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _readOnlyField(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        readOnly: true,
        controller: TextEditingController(text: value),
        decoration: InputDecoration(labelText: label, filled: true, fillColor: const Color(0xFFF8FAFC)),
      ),
    );
  }

  Widget _timeButton(String label, TimeOfDay time, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 4),
            Text(time.format(context), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primary)),
          ],
        ),
      ),
    );
  }
}
