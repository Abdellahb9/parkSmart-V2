import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/auth_provider.dart';
import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../widgets/widgets.dart';

/// Settings entry for the password and signed-in devices. Shared by the
/// driver and technician profiles.
class SecurityTile extends StatelessWidget {
  const SecurityTile({super.key});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return ListTile(
      leading: const Icon(Icons.lock_outline_rounded),
      title: Text(l.securityTitle),
      subtitle: Text(l.securitySubtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: () => showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        builder: (_) => const _SecuritySheet(),
      ),
    );
  }
}

class _SecuritySheet extends StatefulWidget {
  const _SecuritySheet();

  @override
  State<_SecuritySheet> createState() => _SecuritySheetState();
}

class _SecuritySheetState extends State<_SecuritySheet> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false;
  bool _signingOut = false;
  String? _error;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _saving = true);
    try {
      await context.read<AuthProvider>().changePassword(_current.text, _next.text);
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      final message = context.l10n.securityChanged;
      Navigator.of(context).pop();
      messenger.showSnackBar(SnackBar(content: Text(message)));
    } catch (e) {
      if (!mounted) return;
      // The server's message, already in the app's language.
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _signOutEverywhere() async {
    final l = context.l10n;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l.securityEverywhereConfirmTitle),
        content: Text(l.securityEverywhereConfirmBody),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: Text(l.commonCancel)),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(l.securityEverywhereConfirm, style: TextStyle(color: context.colors.danger)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() {
      _signingOut = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthProvider>();
      Navigator.of(context).pop();
      // Signed out: the router sends the app back to the login screen.
      await auth.logoutEverywhere();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _signingOut = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final c = context.colors;
    // Keeps the form above the keyboard.
    final inset = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(ApSpace.s4, 0, ApSpace.s4, ApSpace.s4 + inset),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(l.securityTitle, style: Theme.of(context).textTheme.titleMedium),
              const AppGap(ApSpace.s1),
              Text(l.securityIntro, style: Theme.of(context).textTheme.bodySmall),
              const AppGap(ApSpace.s4),
              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(ApSpace.s3),
                  decoration: BoxDecoration(
                    color: c.spotOccupiedBg,
                    borderRadius: BorderRadius.circular(ApRadius.md),
                  ),
                  child: Text(_error!, style: TextStyle(color: c.spotOccupied, fontSize: ApText.sm)),
                ),
                const AppGap(ApSpace.s3),
              ],
              TextFormField(
                controller: _current,
                obscureText: true,
                autofillHints: const [AutofillHints.password],
                decoration: InputDecoration(labelText: l.securityCurrent),
                validator: (v) => (v ?? '').isEmpty ? l.securityErrCurrent : null,
              ),
              const AppGap(ApSpace.s3),
              TextFormField(
                controller: _next,
                obscureText: true,
                autofillHints: const [AutofillHints.newPassword],
                decoration: InputDecoration(labelText: l.securityNew, helperText: l.securityNewHint),
                validator: (v) {
                  final value = v ?? '';
                  if (value.length < 8) return l.securityErrLength;
                  if (value == _current.text) return l.securityErrSame;
                  return null;
                },
              ),
              const AppGap(ApSpace.s3),
              TextFormField(
                controller: _confirm,
                obscureText: true,
                autofillHints: const [AutofillHints.newPassword],
                decoration: InputDecoration(labelText: l.securityConfirm),
                validator: (v) => v != _next.text ? l.securityErrConfirm : null,
                onFieldSubmitted: (_) => _submit(),
              ),
              const AppGap(ApSpace.s4),
              AppButton(
                label: l.securitySubmit,
                icon: Icons.check_rounded,
                loading: _saving,
                expand: true,
                onPressed: _signingOut ? null : _submit,
              ),
              const AppGap(ApSpace.s6),
              Divider(color: c.border, height: 1),
              const AppGap(ApSpace.s4),
              Text(l.securityEverywhere, style: Theme.of(context).textTheme.titleSmall),
              const AppGap(ApSpace.s1),
              Text(l.securityEverywhereHint, style: Theme.of(context).textTheme.bodySmall),
              const AppGap(ApSpace.s3),
              AppButton(
                label: l.securityEverywhereConfirm,
                icon: Icons.devices_other_rounded,
                variant: AppButtonVariant.secondary,
                loading: _signingOut,
                expand: true,
                onPressed: _saving ? null : _signOutEverywhere,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
