import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/app_router.dart';
import '../../core/auth_provider.dart';
import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../widgets/widgets.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    setState(() => _error = null);

    try {
      final user = await context.read<AuthProvider>().register(
            fullName: _name.text.trim(),
            email: _email.text.trim(),
            password: _password.text,
            phone: _phone.text.trim(),
          );
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
      appBar: AppBar(title: Text(l.registerTitle)),
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
                    Text(l.registerWelcome, style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: ApSpace.s2),
                    Text(
                      l.registerSubtitle,
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
                        child: Text(_error!, style: TextStyle(color: c.spotOccupied, fontSize: ApText.sm)),
                      ),
                      const SizedBox(height: ApSpace.s4),
                    ],

                    TextFormField(
                      controller: _name,
                      decoration: InputDecoration(labelText: l.fieldFullName),
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.name],
                      validator: (v) => (v ?? '').trim().isEmpty ? l.nameRequired : null,
                    ),
                    const SizedBox(height: ApSpace.s4),
                    TextFormField(
                      controller: _email,
                      decoration: InputDecoration(labelText: l.fieldEmail),
                      textDirection: TextDirection.ltr,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.email],
                      validator: (v) {
                        final value = (v ?? '').trim();
                        if (value.isEmpty) return l.emailRequired;
                        if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value)) return l.emailInvalid;
                        return null;
                      },
                    ),
                    const SizedBox(height: ApSpace.s4),
                    TextFormField(
                      controller: _phone,
                      decoration: InputDecoration(labelText: l.fieldPhone, hintText: '+2126…'),
                      textDirection: TextDirection.ltr,
                      keyboardType: TextInputType.phone,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.telephoneNumber],
                    ),
                    const SizedBox(height: ApSpace.s4),
                    TextFormField(
                      controller: _password,
                      obscureText: _obscure,
                      decoration: InputDecoration(
                        labelText: l.fieldPassword,
                        helperText: l.passwordHelper,
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscure = !_obscure),
                          tooltip: _obscure ? l.showPassword : l.hidePassword,
                          icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                        ),
                      ),
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.newPassword],
                      onFieldSubmitted: (_) => _submit(),
                      validator: (v) => (v ?? '').length < 6 ? l.passwordMin : null,
                    ),
                    const SizedBox(height: ApSpace.s6),
                    AppButton(label: l.registerSubmit, onPressed: _submit, loading: loading, expand: true),
                    const SizedBox(height: ApSpace.s3),
                    TextButton(
                      onPressed: loading ? null : () => context.go('/login'),
                      child: Text(l.registerHaveAccount),
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
