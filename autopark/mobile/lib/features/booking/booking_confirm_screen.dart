import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_service.dart';
import '../../core/constants.dart';

class BookingConfirmScreen extends StatefulWidget {
  final Map<String, dynamic> bookingData;
  const BookingConfirmScreen({super.key, required this.bookingData});
  @override
  State<BookingConfirmScreen> createState() => _BookingConfirmScreenState();
}

class _BookingConfirmScreenState extends State<BookingConfirmScreen> {
  bool _loading = false;
  String? _error;

  Future<void> _confirm() async {
    setState(() { _loading = true; _error = null; });
    try {
      await ApiService.post('/bookings', {
        'parkingId': widget.bookingData['parkingId'],
        'spotNumber': widget.bookingData['spotNumber'],
        'carPlate': widget.bookingData['carPlate'],
        'startTime': widget.bookingData['startTime'],
        'endTime': widget.bookingData['endTime'],
      });
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle, color: AppColors.success, size: 64),
              const SizedBox(height: 16),
              const Text('Réservation confirmée!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              const Text('Votre place est réservée', style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => context.go('/reservations'),
                child: const Text('Voir mes réservations'),
              ),
            ],
          ),
        ),
      );
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.bookingData;

    return Scaffold(
      appBar: AppBar(title: const Text('Confirmation')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Summary card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 12)],
              ),
              child: Column(
                children: [
                  const Icon(Icons.local_parking, color: AppColors.primary, size: 48),
                  const SizedBox(height: 12),
                  Text(d['parkingName'], style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                  Text('Place n°${d['spotNumber']}', style: const TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 20),
                  const Divider(),
                  const SizedBox(height: 12),
                  _summaryRow('Nom', d['userName']),
                  _summaryRow('Plaque', d['carPlate']),
                  _summaryRow('Durée', '${d['totalHours']} heure(s)'),
                  _summaryRow('Prix/h', '${(d['totalPrice'] / d['totalHours']).toStringAsFixed(0)} MAD'),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total à payer', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      Text('${d['totalPrice'].toStringAsFixed(0)} MAD', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 24, color: AppColors.primary)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            if (_error != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppColors.danger.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
              ),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _confirm,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: _loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Confirmer la réservation', style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }
}
