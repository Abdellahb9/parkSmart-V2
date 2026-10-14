import 'package:flutter/material.dart';
// intl has its own TextDirection; the widgets need Flutter's.
import 'package:intl/intl.dart' hide TextDirection;

import '../../core/api_service.dart';
import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../repositories/repositories.dart';
import '../../widgets/widgets.dart';

/// History of fines issued by the signed-in technician.
///
/// The Fine model was write-only: once issued, a fine could not be listed
/// anywhere in the product.
class FinesScreen extends StatefulWidget {
  const FinesScreen({super.key});

  @override
  State<FinesScreen> createState() => _FinesScreenState();
}

class _FinesScreenState extends State<FinesScreen> {
  List<Fine> _fines = [];
  bool _loading = true;
  Object? _error;
  // Photos are served behind the session token, so Image.network needs it.
  Map<String, String> _imageHeaders = const {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final list = await technicianRepo.fines();
      final headers = await ApiService.authHeaders();
      if (!mounted) return;
      setState(() {
        _fines = list;
        _imageHeaders = headers;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  void _openPhoto(Fine fine) {
    showDialog<void>(
      context: context,
      builder: (ctx) => Dialog(
        clipBehavior: Clip.antiAlias,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            InteractiveViewer(
              child: Image.network(technicianRepo.finePhotoUrl(fine.id), headers: _imageHeaders),
            ),
            ListTile(
              title: Text(isolate(fine.carPlate)),
              subtitle: Text(isolate(fine.reason)),
              trailing: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(ctx).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final fmt = DateFormat('d MMM yyyy, HH:mm', l.localeName);

    return Scaffold(
      appBar: AppBar(title: Text(l.finesTitle)),
      body: RefreshIndicator(
        onRefresh: () => _load(silent: true),
        child: AsyncView(
          loading: _loading,
          error: _error,
          onRetry: _load,
          isEmpty: _fines.isEmpty,
          emptyIcon: Icons.gavel_rounded,
          emptyTitle: l.finesEmpty,
          emptyMessage: l.finesEmptyHint,
          builder: (context) => ListView.separated(
            padding: const EdgeInsets.all(ApSpace.s4),
            itemCount: _fines.length,
            separatorBuilder: (_, __) => const AppGap(ApSpace.s3),
            itemBuilder: (context, i) {
              final fine = _fines[i];
              return AppCard(
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: c.spotOverstayBg,
                        borderRadius: BorderRadius.circular(ApRadius.sm),
                      ),
                      child: Icon(Icons.gavel_rounded, color: c.spotOverstay, size: 20),
                    ),
                    const AppGap(ApSpace.s3, axis: Axis.horizontal),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(isolate(fine.carPlate), style: Theme.of(context).textTheme.titleSmall),
                          const AppGap(ApSpace.s1),
                          Text(isolate(fine.reason), style: Theme.of(context).textTheme.bodySmall),
                          if (fine.issuedAt != null)
                            Text(fmt.format(fine.issuedAt!), style: Theme.of(context).textTheme.bodySmall),
                          if (fine.hasPhoto) ...[
                            const AppGap(ApSpace.s1),
                            StatusBadge(label: l.finesPhotoBadge, tone: AppTone.normal, icon: Icons.photo_camera_outlined),
                          ],
                        ],
                      ),
                    ),
                    if (fine.hasPhoto)
                      GestureDetector(
                        onTap: () => _openPhoto(fine),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(ApRadius.sm),
                          child: Image.network(
                            technicianRepo.finePhotoUrl(fine.id),
                            headers: _imageHeaders,
                            width: 64,
                            height: 48,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Icon(Icons.broken_image_outlined, color: c.textMuted),
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
