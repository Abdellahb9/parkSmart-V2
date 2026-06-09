import 'package:flutter/material.dart';
import '../../core/api_service.dart';
import '../../core/constants.dart';

class ComplaintsScreen extends StatefulWidget {
  const ComplaintsScreen({super.key});
  @override
  State<ComplaintsScreen> createState() => _ComplaintsScreenState();
}

class _ComplaintsScreenState extends State<ComplaintsScreen> {
  final _messageController = TextEditingController();
  List<dynamic> _parkings = [];
  List<dynamic> _complaints = [];
  String? _selectedParkingId;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final parkingsData = await ApiService.get('/parkings');
      final complaintsData = await ApiService.get('/complaints');
      setState(() {
        _parkings = List.from(parkingsData);
        _complaints = List.from(complaintsData);
        if (_parkings.isNotEmpty && _selectedParkingId == null) {
          _selectedParkingId = _parkings[0]['_id'];
        }
      });
    } catch (e) {
      debugPrint('Error: $e');
    }
  }

  Future<void> _submitComplaint() async {
    if (_messageController.text.trim().isEmpty || _selectedParkingId == null) return;
    setState(() => _sending = true);
    try {
      await ApiService.post('/complaints', {
        'parkingId': _selectedParkingId,
        'message': _messageController.text.trim(),
      });
      _messageController.clear();
      await _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Réclamation envoyée'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Réclamations')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Submit form
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Nouvelle réclamation', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 16),

                  DropdownButtonFormField<String>(
                    initialValue: _selectedParkingId,
                    decoration: const InputDecoration(labelText: 'Parking concerné'),
                    items: _parkings.map<DropdownMenuItem<String>>((p) {
                      return DropdownMenuItem(value: p['_id'] as String, child: Text(p['name'] as String));
                    }).toList(),
                    onChanged: (v) => setState(() => _selectedParkingId = v),
                  ),
                  const SizedBox(height: 14),

                  TextField(
                    controller: _messageController,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Votre message',
                      alignLabelWithHint: true,
                      hintText: 'Décrivez votre problème...',
                    ),
                  ),
                  const SizedBox(height: 16),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _sending ? null : _submitComplaint,
                      child: _sending
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Envoyer'),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            const Text('Mes réclamations', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),

            ..._complaints.map((c) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(c['parkingId']?['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: (c['status'] == 'open' ? AppColors.warning : AppColors.success).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          c['status'] == 'open' ? 'En cours' : 'Résolu',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: c['status'] == 'open' ? AppColors.warning : AppColors.success),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(c['message'], style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }
}
