import 'package:flutter/material.dart';
// intl has its own TextDirection; the widgets need Flutter's.
import 'package:intl/intl.dart' hide TextDirection;

import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../repositories/repositories.dart';
import '../../widgets/widgets.dart';

class ComplaintsScreen extends StatefulWidget {
  const ComplaintsScreen({super.key});

  @override
  State<ComplaintsScreen> createState() => _ComplaintsScreenState();
}

class _ComplaintsScreenState extends State<ComplaintsScreen> {
  final _message = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  List<Parking> _parkings = [];
  List<Complaint> _complaints = [];
  String? _parkingId;
  bool _loading = true;
  bool _sending = false;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      // Run both in parallel; a failure on either used to blank the whole page.
      final results = await Future.wait([parkingRepo.list(), complaintRepo.mine()]);
      if (!mounted) return;
      setState(() {
        _parkings = results[0] as List<Parking>;
        _complaints = results[1] as List<Complaint>;
        _parkingId ??= _parkings.isNotEmpty ? _parkings.first.id : null;
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

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_parkingId == null) return;
    FocusScope.of(context).unfocus();

    setState(() => _sending = true);
    try {
      await complaintRepo.create(parkingId: _parkingId!, message: _message.text.trim());
      if (!mounted) return;
      _message.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.cmpSent)),
      );
      await _load(silent: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      // Guarded: this used to fire after the screen was gone.
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final fmt = DateFormat('d MMM yyyy', l.localeName);

    return Scaffold(
      appBar: AppBar(title: Text(l.cmpTitle)),
      body: RefreshIndicator(
        onRefresh: () => _load(silent: true),
        child: AsyncView(
          loading: _loading,
          error: _error,
          onRetry: _load,
          builder: (context) => ListView(
            padding: const EdgeInsets.all(ApSpace.s4),
            children: [
              AppCard(
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l.cmpReport, style: Theme.of(context).textTheme.titleMedium),
                      const AppGap(ApSpace.s4),
                      DropdownButtonFormField<String>(
                        // `value`, not `initialValue`: the list arrives after
                        // the first build and the two used to desync.
                        initialValue: _parkingId,
                        isExpanded: true,
                        decoration: InputDecoration(labelText: l.cmpParking),
                        items: [
                          for (final p in _parkings)
                            DropdownMenuItem(value: p.id, child: Text(p.name, overflow: TextOverflow.ellipsis)),
                        ],
                        onChanged: (v) => setState(() => _parkingId = v),
                        validator: (v) => v == null ? l.cmpChooseParking : null,
                      ),
                      const AppGap(ApSpace.s4),
                      TextFormField(
                        controller: _message,
                        maxLines: 4,
                        maxLength: 500,
                        decoration: InputDecoration(
                          labelText: l.cmpMessage,
                          hintText: l.cmpMessageHint,
                          alignLabelWithHint: true,
                        ),
                        validator: (v) => (v ?? '').trim().length < 10 ? l.cmpMessageMin : null,
                      ),
                      const AppGap(ApSpace.s2),
                      AppButton(
                        label: l.commonSend,
                        icon: Icons.send_rounded,
                        loading: _sending,
                        expand: true,
                        onPressed: _parkings.isEmpty ? null : _submit,
                      ),
                    ],
                  ),
                ),
              ),
              const AppGap(ApSpace.s6),
              Text(l.cmpMine, style: Theme.of(context).textTheme.titleMedium),
              const AppGap(ApSpace.s3),
              if (_complaints.isEmpty)
                AppCard(
                  child: Row(
                    children: [
                      Icon(Icons.check_circle_outline, color: context.colors.spotFree, size: 20),
                      const AppGap(ApSpace.s3, axis: Axis.horizontal),
                      Expanded(
                        child: Text(
                          l.cmpNone,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                )
              else
                for (final complaint in _complaints) ...[
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                complaint.parkingName ?? '',
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                            ),
                            StatusBadge(
                              label: complaint.isResolved ? l.cmpResolved : l.cmpOpen,
                              tone: complaint.isResolved ? AppTone.free : AppTone.reserved,
                            ),
                          ],
                        ),
                        const AppGap(ApSpace.s2),
                        Text(isolate(complaint.message), style: Theme.of(context).textTheme.bodyMedium),
                        if (complaint.createdAt != null) ...[
                          const AppGap(ApSpace.s2),
                          Text(fmt.format(complaint.createdAt!), style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ],
                    ),
                  ),
                  const AppGap(ApSpace.s3),
                ],
            ],
          ),
        ),
      ),
    );
  }
}
