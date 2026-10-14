import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/auth_provider.dart';
import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../widgets/widgets.dart';

class _Slide {
  final IconData icon;
  final String title;
  final String body;
  const _Slide(this.icon, this.title, this.body);
}

List<_Slide> _slidesFor(AppLocalizations l) => [
      _Slide(Icons.map_outlined, l.onb1Title, l.onb1Body),
      _Slide(Icons.event_available_outlined, l.onb2Title, l.onb2Body),
      _Slide(Icons.card_giftcard_outlined, l.onb3Title, l.onb3Body),
    ];

const _slideCount = 3;

/// Shown once, on first launch.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await context.read<AuthProvider>().completeOnboarding();
    if (!mounted) return;
    context.go('/login');
  }

  void _next() {
    if (_page >= _slideCount - 1) {
      _finish();
      return;
    }
    _controller.nextPage(duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l = context.l10n;
    final slides = _slidesFor(l);
    final isLast = _page == _slideCount - 1;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: AlignmentDirectional.centerEnd,
              child: Padding(
                padding: const EdgeInsets.all(ApSpace.s2),
                child: TextButton(onPressed: _finish, child: Text(l.onbSkip)),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: slides.length,
                onPageChanged: (i) => setState(() => _page = i),
                itemBuilder: (context, i) {
                  final s = slides[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: ApSpace.s6),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 112,
                          height: 112,
                          decoration: BoxDecoration(color: c.primarySoft, shape: BoxShape.circle),
                          child: Icon(s.icon, size: 52, color: c.primary),
                        ),
                        const SizedBox(height: ApSpace.s8),
                        Text(s.title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
                        const SizedBox(height: ApSpace.s3),
                        Text(
                          s.body,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: c.textMuted),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(ApSpace.s6),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(slides.length, (i) {
                      final active = i == _page;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 220),
                        margin: const EdgeInsets.symmetric(horizontal: ApSpace.s1),
                        width: active ? 22 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: active ? c.primary : c.borderStrong,
                          borderRadius: BorderRadius.circular(ApRadius.full),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: ApSpace.s6),
                  AppButton(
                    label: isLast ? l.onbStart : l.onbNext,
                    onPressed: _next,
                    expand: true,
                    icon: isLast ? Icons.check_rounded : Icons.arrow_forward_rounded,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
