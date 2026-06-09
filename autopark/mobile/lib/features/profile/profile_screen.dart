import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/auth_provider.dart';
import '../../core/api_service.dart';
import '../../core/constants.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _rewardsData;

  @override
  void initState() {
    super.initState();
    _loadRewards();
  }

  Future<void> _loadRewards() async {
    try {
      final data = await ApiService.get('/rewards');
      setState(() => _rewardsData = Map<String, dynamic>.from(data));
    } catch (e) {
      debugPrint('Error loading rewards: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final initials = (user?['fullName'] ?? 'U').toString().split(' ').map((n) => n.isNotEmpty ? n[0] : '').join().toUpperCase();

    return Scaffold(
      appBar: AppBar(title: const Text('Mon profil')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Profile card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryDark]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: Colors.white.withValues(alpha: 0.2),
                    child: Text(initials, style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w700)),
                  ),
                  const SizedBox(height: 14),
                  Text(user?['fullName'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(user?['email'] ?? '', style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(user?['phone'] ?? '', style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 14)),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Loyalty points
            if (_rewardsData != null && (_rewardsData!['loyaltyPoints'] as List).isNotEmpty) ...[
              const Align(alignment: Alignment.centerLeft, child: Text('Points de fidélité', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700))),
              const SizedBox(height: 12),
              ...(_rewardsData!['loyaltyPoints'] as List).map((lp) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(lp['parkingId']?['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                      child: Text('${lp['bookingCount']} réservations', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.accentDark, fontSize: 13)),
                    ),
                  ],
                ),
              )),
              const SizedBox(height: 24),
            ],

            // Rewards
            if (_rewardsData != null && (_rewardsData!['rewards'] as List).isNotEmpty) ...[
              const Align(alignment: Alignment.centerLeft, child: Text('Récompenses', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700))),
              const SizedBox(height: 12),
              ...(_rewardsData!['rewards'] as List).map((r) {
                final unlocked = r['unlocked'] == true;
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: unlocked ? AppColors.success.withValues(alpha: 0.05) : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: unlocked ? AppColors.success.withValues(alpha: 0.3) : AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(child: Text(r['title'], style: const TextStyle(fontWeight: FontWeight.w600))),
                          if (unlocked) const Icon(Icons.check_circle, color: AppColors.success, size: 20),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text('${r['currentBookings']} / ${r['requiredBookings']} réservations', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: (r['progress'] as num).toDouble() / 100,
                          backgroundColor: AppColors.border,
                          valueColor: AlwaysStoppedAnimation(unlocked ? AppColors.success : AppColors.primary),
                          minHeight: 6,
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],

            const SizedBox(height: 24),

            // Logout
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => auth.logout(),
                icon: const Icon(Icons.logout, color: AppColors.danger),
                label: const Text('Déconnexion', style: TextStyle(color: AppColors.danger)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(color: AppColors.danger),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
