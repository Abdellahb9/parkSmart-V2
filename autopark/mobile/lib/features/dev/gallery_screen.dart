import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme_controller.dart';
import '../../design/app_theme.dart';
import '../../widgets/widgets.dart';

/// Development-only gallery of the shared widget library.
///
/// Reachable at /dev/ui in debug builds. Exists so the design system can be
/// reviewed in both themes without walking the whole app.
class GalleryScreen extends StatefulWidget {
  const GalleryScreen({super.key});

  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  String _state = 'data';

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final theme = context.watch<ThemeController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Design system'),
        actions: [
          IconButton(
            onPressed: theme.cycle,
            tooltip: 'Changer de thème (${theme.mode.name})',
            icon: Icon(switch (theme.mode) {
              ThemeMode.light => Icons.light_mode_outlined,
              ThemeMode.dark => Icons.dark_mode_outlined,
              ThemeMode.system => Icons.brightness_auto_outlined,
            }),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(ApSpace.s4),
        children: [
          _section(context, 'Boutons', [
            const Wrap(
              spacing: ApSpace.s2,
              runSpacing: ApSpace.s2,
              children: [
                AppButton(label: 'Réserver', onPressed: _noop),
                AppButton(label: 'Annuler', variant: AppButtonVariant.secondary, onPressed: _noop),
                AppButton(label: 'Détails', variant: AppButtonVariant.ghost, onPressed: _noop),
                AppButton(label: 'Supprimer', variant: AppButtonVariant.danger, onPressed: _noop),
                AppButton(label: 'Voie publique', variant: AppButtonVariant.accent, onPressed: _noop),
                AppButton(label: 'Chargement', loading: true),
                AppButton(label: 'Désactivé'),
                AppButton(label: 'Avec icône', icon: Icons.local_parking, onPressed: _noop),
              ],
            ),
          ]),
          _section(context, 'Badges d’état', [
            const Wrap(
              spacing: ApSpace.s2,
              runSpacing: ApSpace.s2,
              children: [
                StatusBadge(label: 'Parking normal', tone: AppTone.normal, dot: true),
                StatusBadge(label: 'Voie publique', tone: AppTone.street, dot: true),
                StatusBadge(label: 'Disponible', tone: AppTone.free),
                StatusBadge(label: 'Réservée', tone: AppTone.reserved),
                StatusBadge(label: 'Occupée', tone: AppTone.occupied),
                StatusBadge(label: 'Dépassement', tone: AppTone.overstay, icon: Icons.warning_amber_rounded),
                StatusBadge(label: 'Bloquée', tone: AppTone.blocked),
                StatusBadge(label: 'Neutre'),
              ],
            ),
          ]),
          _section(context, 'Cartes', [
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Boulevard Hassan II', style: Theme.of(context).textTheme.titleSmall),
                  const AppGap(ApSpace.s1),
                  Text('20 places · 19 disponibles', style: Theme.of(context).textTheme.bodySmall),
                  const AppGap(ApSpace.s3),
                  const StatusBadge(label: 'Voie publique', tone: AppTone.street, dot: true),
                ],
              ),
            ),
            const AppGap(ApSpace.s3),
            AppCard(
              elevated: true,
              onTap: _noop,
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(color: c.primarySoft, borderRadius: BorderRadius.circular(ApRadius.md)),
                    child: Icon(Icons.local_parking, color: c.parkingNormal),
                  ),
                  const AppGap(ApSpace.s3, axis: Axis.horizontal),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Parking Al Massira', style: Theme.of(context).textTheme.titleSmall),
                        Text('8 MAD/h', style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right, color: c.textMuted),
                ],
              ),
            ),
          ]),
          _section(context, 'Squelettes', [
            const SkeletonBox(width: 180, height: 20),
            const AppGap(ApSpace.s2),
            const SkeletonBox(height: 14),
            const AppGap(ApSpace.s2),
            const SkeletonBox(width: 120, height: 14),
          ]),
          _section(context, 'États asynchrones', [
            Wrap(
              spacing: ApSpace.s2,
              children: [
                for (final s in ['data', 'loading', 'empty', 'error'])
                  ChoiceChip(
                    label: Text(s),
                    selected: _state == s,
                    onSelected: (_) => setState(() => _state = s),
                  ),
              ],
            ),
            const AppGap(ApSpace.s3),
            SizedBox(
              height: 260,
              child: AppCard(
                padding: EdgeInsets.zero,
                child: AsyncView(
                  loading: _state == 'loading',
                  error: _state == 'error' ? 'Serveur injoignable. Vérifiez votre connexion.' : null,
                  isEmpty: _state == 'empty',
                  onRetry: () => setState(() => _state = 'data'),
                  emptyTitle: 'Aucune réservation',
                  emptyMessage: 'Vos réservations apparaîtront ici.',
                  emptyIcon: Icons.event_busy_outlined,
                  emptyAction: const AppButton(
                    label: 'Trouver une place',
                    variant: AppButtonVariant.secondary,
                    onPressed: _noop,
                  ),
                  loadingWidget: const SkeletonList(count: 2),
                  builder: (_) => Center(
                    child: Text('Contenu chargé', style: Theme.of(context).textTheme.bodyMedium),
                  ),
                ),
              ),
            ),
          ]),
          _section(context, 'Convention de couleur', [
            Text(
              'Bleu = parking normal, doré = voie publique. Défini une seule fois dans design/tokens/domain.json.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const AppGap(ApSpace.s3),
            Wrap(
              spacing: ApSpace.s4,
              runSpacing: ApSpace.s2,
              children: [
                _swatch(context, c.parkingNormal, 'Normal'),
                _swatch(context, c.parkingStreet, 'Voie publique'),
                _swatch(context, c.spotFree, 'Libre'),
                _swatch(context, c.spotReserved, 'Réservée'),
                _swatch(context, c.spotOccupied, 'Occupée'),
              ],
            ),
          ]),
          const AppGap(ApSpace.s8),
        ],
      ),
    );
  }

  static void _noop() {}

  Widget _section(BuildContext context, String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        const AppGap(ApSpace.s3),
        ...children,
        const AppGap(ApSpace.s8),
      ],
    );
  }

  Widget _swatch(BuildContext context, Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 16, height: 16, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const AppGap(ApSpace.s2, axis: Axis.horizontal),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
