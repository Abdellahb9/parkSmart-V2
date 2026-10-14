import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/app_router.dart';
import '../../core/auth_provider.dart';
import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../widgets/widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _passwordFocus = FocusNode();
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    // Controllers and focus nodes were never disposed anywhere in the app.
    _email.dispose();
    _password.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    setState(() => _error = null);

    try {
      final user = await context.read<AuthProvider>().login(_email.text.trim(), _password.text);
      if (!mounted) return;
      context.go(homeFor(user.role));
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final loading = context.watch<AuthProvider>().loading;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(ApSpace.s6),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(color: c.primary, borderRadius: BorderRadius.circular(ApRadius.lg)),
                        child: Center(
                          child: Text(
                            'AP',
                            style: TextStyle(color: c.onPrimary, fontSize: ApText.xl2, fontWeight: ApWeight.bold),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: ApSpace.s5),
                    Text(l.loginTitle, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: ApSpace.s2),
                    Text(
                      l.loginSubtitle,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: ApSpace.s6),

                    if (_error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(ApSpace.s3),
                        decoration: BoxDecoration(
                          color: c.spotOccupiedBg,
                          borderRadius: BorderRadius.circular(ApRadius.md),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline, size: 18, color: c.spotOccupied),
                            const SizedBox(width: ApSpace.s2),
                            Expanded(
                              child: Text(
                                _error!,
                                style: TextStyle(color: c.spotOccupied, fontSize: ApText.sm),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: ApSpace.s4),
                    ],

                    TextFormField(
                      controller: _email,
                      decoration: InputDecoration(labelText: l.fieldEmail, hintText: l.emailHint),
                      textDirection: TextDirection.ltr,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.username, AutofillHints.email],
                      onFieldSubmitted: (_) => _passwordFocus.requestFocus(),
                      validator: (v) {
                        final value = (v ?? '').trim();
                        if (value.isEmpty) return l.emailRequired;
                        if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value)) return l.emailInvalid;
                        return null;
                      },
                    ),
                    const SizedBox(height: ApSpace.s4),
                    TextFormField(
                      controller: _password,
                      focusNode: _passwordFocus,
                      obscureText: _obscure,
                      decoration: InputDecoration(
                        labelText: l.fieldPassword,
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscure = !_obscure),
                          tooltip: _obscure ? l.showPassword : l.hidePassword,
                          icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                        ),
                      ),
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.password],
                      onFieldSubmitted: (_) => _submit(),
                      validator: (v) => (v ?? '').length < 6 ? l.passwordMin : null,
                    ),
                    const SizedBox(height: ApSpace.s6),
                    AppButton(label: l.loginSubmit, onPressed: _submit, loading: loading, expand: true),
                    const SizedBox(height: ApSpace.s4),
                    TextButton(
                      onPressed: loading ? null : () => context.go('/register'),
                      child: Text(l.loginCreateAccount),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
