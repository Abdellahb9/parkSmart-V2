import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/api_service.dart';
import '../../core/constants.dart';
import 'dart:math' as math;

class ReservationsScreen extends StatefulWidget {
  const ReservationsScreen({super.key});
  @override
  State<ReservationsScreen> createState() => _ReservationsScreenState();
}

class _ReservationsScreenState extends State<ReservationsScreen> {
  List<dynamic> _bookings = [];
  bool _loading = true;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _loadBookings();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _loadBookings());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadBookings() async {
    try {
      final data = await ApiService.get('/reservations');
      if (mounted) setState(() { _bookings = List.from(data); _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic>? get _activeBooking {
    try {
      return _bookings.firstWhere((b) => b['status'] == 'active');
    } catch (_) {
      return null;
    }
  }

  List<dynamic> get _pastBookings => _bookings.where((b) => b['status'] != 'active').toList();

  Future<void> _cancelBooking(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Annuler la réservation?'),
        content: const Text('Une pénalité de 20% sera appliquée si la réservation est active.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Non')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Oui, annuler'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ApiService.patch('/bookings/$id/cancel');
        _loadBookings();
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes réservations')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadBookings,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Active booking with countdown
                  if (_activeBooking != null) ...[
                    _ActiveBookingCard(booking: _activeBooking!, onCancel: () => _cancelBooking(_activeBooking!['_id'])),
                    const SizedBox(height: 24),
                  ],

                  if (_activeBooking == null)
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Column(
                        children: [
                          Icon(Icons.event_available, size: 48, color: AppColors.textSecondary),
                          SizedBox(height: 12),
                          Text('Aucune réservation active', style: TextStyle(color: AppColors.textSecondary)),
                        ],
                      ),
                    ),

                  const SizedBox(height: 16),
                  const Text('Historique', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),

                  ..._pastBookings.map((b) => _PastBookingCard(booking: b)),
                ],
              ),
            ),
    );
  }
}

class _ActiveBookingCard extends StatefulWidget {
  final Map<String, dynamic> booking;
  final VoidCallback onCancel;
  const _ActiveBookingCard({required this.booking, required this.onCancel});
  @override
  State<_ActiveBookingCard> createState() => _ActiveBookingCardState();
}

class _ActiveBookingCardState extends State<_ActiveBookingCard> {
  Timer? _timer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _updateRemaining();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _updateRemaining());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _updateRemaining() {
    final endTime = DateTime.parse(widget.booking['endTime']);
    final remaining = endTime.difference(DateTime.now());
    if (mounted) setState(() => _remaining = remaining.isNegative ? Duration.zero : remaining);
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.booking;
    final progress = _remaining.inSeconds <= 0 ? 1.0 : 1.0 - (_remaining.inSeconds / (b['totalHours'] * 3600));

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryDark]),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 6))],
      ),
      child: Column(
        children: [
          // Countdown circle
          SizedBox(
            width: 140,
            height: 140,
            child: CustomPaint(
              painter: _CountdownPainter(progress.clamp(0.0, 1.0)),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${_remaining.inHours.toString().padLeft(2, '0')}:${(_remaining.inMinutes % 60).toString().padLeft(2, '0')}:${(_remaining.inSeconds % 60).toString().padLeft(2, '0')}',
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
                    ),
                    const Text('restant', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(b['parkingId']?['name'] ?? 'Parking', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
          Text('Place n°${b['spotNumber']} • ${b['carPlate']}', style: const TextStyle(color: Colors.white70, fontSize: 13)),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: widget.onCancel,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent, foregroundColor: AppColors.textPrimary),
              child: const Text('Annuler la réservation'),
            ),
          ),
        ],
      ),
    );
  }
}

class _CountdownPainter extends CustomPainter {
  final double progress;
  _CountdownPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 8;

    // Background circle
    canvas.drawCircle(center, radius, Paint()..color = Colors.white.withValues(alpha: 0.15)..style = PaintingStyle.stroke..strokeWidth = 8);

    // Progress arc
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * (1 - progress),
      false,
      Paint()..color = AppColors.accent..style = PaintingStyle.stroke..strokeWidth = 8..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _CountdownPainter old) => old.progress != progress;
}

class _PastBookingCard extends StatelessWidget {
  final Map<String, dynamic> booking;
  const _PastBookingCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    final statusColors = {'done': AppColors.success, 'cancelled': AppColors.danger, 'pending': AppColors.warning};
    final statusLabels = {'done': 'Terminée', 'cancelled': 'Annulée', 'pending': 'En attente'};

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(booking['parkingId']?['name'] ?? 'Parking', style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text('Place ${booking['spotNumber']} • ${booking['totalHours']}h • ${booking['totalPrice']} MAD', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: (statusColors[booking['status']] ?? AppColors.textSecondary).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              statusLabels[booking['status']] ?? booking['status'],
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: statusColors[booking['status']] ?? AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}
