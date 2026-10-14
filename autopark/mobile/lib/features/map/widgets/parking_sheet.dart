import 'package:flutter/material.dart';

import '../../../design/app_theme.dart';
import '../../../l10n/l10n.dart';
import '../../../models/models.dart';
import '../../../widgets/widgets.dart';

/// Draggable preview for a parking, replacing the fixed card that popped in
/// with no animation and could not be swiped away.
class ParkingSheet extends StatelessWidget {
  final Parking parking;
  final VoidCallback onReserve;

  const ParkingSheet({super.key, required this.parking, required this.onReserve});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;

    return DraggableScrollableSheet(
      initialChildSize: 0.45,
      minChildSize: 0.3,
      maxChildSize: 0.85,
      expand: false,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(ApRadius.xl)),
        ),
        child: ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(ApSpace.s5, ApSpace.s3, ApSpace.s5, ApSpace.s6),
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: c.borderStrong,
                  borderRadius: BorderRadius.circular(ApRadius.full),
                ),
              ),
            ),
            const AppGap(ApSpace.s4),

            Text(parking.name, style: Theme.of(context).textTheme.titleLarge),
            const AppGap(ApSpace.s2),
            StatusBadge(
              label: parking.isStreet ? l.parkingTypeStreet : l.parkingTypeNormal,
              tone: parking.isStreet ? AppTone.street : AppTone.normal,
              dot: true,
            ),
            if (parking.address.isNotEmpty) ...[
              const AppGap(ApSpace.s3),
              Row(
                children: [
                  Icon(Icons.place_outlined, size: 16, color: c.textMuted),
                  const AppGap(ApSpace.s1, axis: Axis.horizontal),
                  Expanded(child: Text(parking.address, style: Theme.of(context).textTheme.bodySmall)),
                ],
              ),
            ],

            const AppGap(ApSpace.s5),
            Row(
              children: [
                Expanded(
                  child: _Stat(
                    icon: Icons.local_parking,
                    label: l.sheetFreeSpots,
                    value: '${parking.availableSpots} / ${parking.totalSpots}',
                    tone: parking.availableSpots == 0 ? c.spotOccupied : c.spotFree,
                  ),
                ),
                const AppGap(ApSpace.s3, axis: Axis.horizontal),
                Expanded(
                  child: _Stat(
                    icon: Icons.payments_outlined,
                    label: l.sheetHourly,
                    value: mad(context, parking.pricePerHour),
                    tone: c.primary,
                  ),
                ),
              ],
            ),

            if (parking.ownerName != null) ...[
              const AppGap(ApSpace.s4),
              Row(
                children: [
                  Icon(Icons.badge_outlined, size: 16, color: c.textMuted),
                  const AppGap(ApSpace.s2, axis: Axis.horizontal),
                  Text(l.sheetManagedBy(parking.ownerName!), style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ],

            const AppGap(ApSpace.s6),
            AppButton(
              label: parking.hasFreeSpots ? l.sheetReserve : l.sheetFull,
              icon: parking.hasFreeSpots ? Icons.event_available : Icons.block,
              expand: true,
              onPressed: parking.hasFreeSpots ? onReserve : null,
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color tone;

  const _Stat({required this.icon, required this.label, required this.value, required this.tone});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.all(ApSpace.s3),
      decoration: BoxDecoration(
        color: c.surfaceAlt,
        borderRadius: BorderRadius.circular(ApRadius.md),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: tone),
          const AppGap(ApSpace.s2),
          Text(value, style: Theme.of(context).textTheme.titleSmall),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
