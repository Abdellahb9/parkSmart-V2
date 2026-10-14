import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../design/app_theme.dart';
import '../l10n/l10n.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/booking/booking_stepper_screen.dart';
import '../features/wallet/wallet_screen.dart';
import '../features/complaints/complaints_screen.dart';
import '../features/dev/gallery_screen.dart';
import '../features/map/map_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/onboarding/splash_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/reservations/reservations_screen.dart';
import '../features/technicien/fines_screen.dart';
import '../features/technicien/scan_screen.dart';
import '../features/technicien/streets_screen.dart';
import '../features/technicien/tech_profile_screen.dart';
import 'auth_provider.dart';

String homeFor(String role) => role == 'technicien' ? '/technicien' : '/map';

class AppRouter {
  static GoRouter router(AuthProvider auth) {
    return GoRouter(
      initialLocation: '/splash',
      refreshListenable: auth,
      redirect: (context, state) {
        final loc = state.matchedLocation;

        // The debug-only gallery sits outside the auth flow.
        if (kDebugMode && loc.startsWith('/dev')) return null;

        // Hold everything on the splash until the stored session is read, so
        // a cold start no longer flashes the login screen.
        if (!auth.bootstrapped) return loc == '/splash' ? null : '/splash';

        final signedIn = auth.isAuthenticated;
        final isEntry = loc == '/login' || loc == '/register' || loc == '/onboarding';

        if (loc == '/splash') {
          if (signedIn) return homeFor(auth.role);
          return auth.onboardingSeen ? '/login' : '/onboarding';
        }

        if (!signedIn) return isEntry ? null : '/login';
        if (isEntry) return homeFor(auth.role);

        // Role gate. The router previously checked only that you were signed
        // in, so a driver could open the technician screens and vice versa —
        // the API refused and the refusal was swallowed into a blank page.
        final isTechnician = auth.role == 'technicien';
        final wantsTechnician = loc.startsWith('/technicien');
        if (isTechnician && !wantsTechnician) return '/technicien';
        if (!isTechnician && wantsTechnician) return homeFor(auth.role);

        return null;
      },
      routes: [
        GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
        GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
        if (kDebugMode) GoRoute(path: '/dev/ui', builder: (_, __) => const GalleryScreen()),

        // Driver shell
        ShellRoute(
          builder: (context, state, child) => UserShell(child: child),
          routes: [
            GoRoute(path: '/map', builder: (_, __) => const MapScreen()),
            GoRoute(path: '/reservations', builder: (_, __) => const ReservationsScreen()),
            GoRoute(path: '/complaints', builder: (_, __) => const ComplaintsScreen()),
            GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          ],
        ),

        GoRoute(path: '/wallet', builder: (_, __) => const WalletScreen()),

        // The booking flow is one route that owns its own state, so there is
        // no `state.extra as Map<String, dynamic>` cast left to crash on.
        GoRoute(
          path: '/booking/:parkingId',
          builder: (_, state) => BookingStepperScreen(parkingId: state.pathParameters['parkingId']!),
        ),

        // Technician shell
        ShellRoute(
          builder: (context, state, child) => TechShell(child: child),
          routes: [
            GoRoute(path: '/technicien', builder: (_, __) => const StreetsScreen()),
            GoRoute(path: '/technicien/scan', builder: (_, __) => const ScanScreen()),
            GoRoute(path: '/technicien/fines', builder: (_, __) => const FinesScreen()),
            GoRoute(path: '/technicien/profile', builder: (_, __) => const TechProfileScreen()),
          ],
        ),
      ],
      errorBuilder: (context, state) => Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(ApSpace.s6),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.explore_off_outlined, size: 48, color: context.colors.textMuted),
                const SizedBox(height: ApSpace.s4),
                Text(context.l10n.notFoundTitle, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: ApSpace.s4),
                FilledButton(onPressed: () => context.go('/map'), child: Text(context.l10n.notFoundBack)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ShellScaffold extends StatelessWidget {
  final Widget child;
  final int index;
  final List<NavigationDestination> destinations;
  final List<String> routes;

  const _ShellScaffold({
    required this.child,
    required this.index,
    required this.destinations,
    required this.routes,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => context.go(routes[i]),
        destinations: destinations,
      ),
    );
  }
}

class UserShell extends StatelessWidget {
  final Widget child;
  const UserShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final location = GoRouterState.of(context).matchedLocation;
    const routes = ['/map', '/reservations', '/complaints', '/profile'];
    final index = routes.indexWhere(location.startsWith);

    return _ShellScaffold(
      index: index < 0 ? 0 : index,
      routes: routes,
      destinations: [
        NavigationDestination(icon: const Icon(Icons.map_outlined), selectedIcon: const Icon(Icons.map), label: l.navMap),
        NavigationDestination(
          icon: const Icon(Icons.event_note_outlined),
          selectedIcon: const Icon(Icons.event_note),
          label: l.navReservations,
        ),
        NavigationDestination(
          icon: const Icon(Icons.chat_bubble_outline),
          selectedIcon: const Icon(Icons.chat_bubble),
          label: l.navComplaints,
        ),
        NavigationDestination(
          icon: const Icon(Icons.person_outline),
          selectedIcon: const Icon(Icons.person),
          label: l.navProfile,
        ),
      ],
      child: child,
    );
  }
}

class TechShell extends StatelessWidget {
  final Widget child;
  const TechShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final location = GoRouterState.of(context).matchedLocation;
    const routes = ['/technicien', '/technicien/scan', '/technicien/fines', '/technicien/profile'];
    var index = 0;
    if (location.startsWith('/technicien/scan')) index = 1;
    if (location.startsWith('/technicien/fines')) index = 2;
    if (location.startsWith('/technicien/profile')) index = 3;

    return _ShellScaffold(
      index: index,
      routes: routes,
      destinations: [
        NavigationDestination(
          icon: const Icon(Icons.add_road_outlined),
          selectedIcon: const Icon(Icons.add_road),
          label: l.navStreets,
        ),
        NavigationDestination(
          icon: const Icon(Icons.qr_code_scanner_outlined),
          selectedIcon: const Icon(Icons.qr_code_scanner),
          label: l.navScan,
        ),
        NavigationDestination(
          icon: const Icon(Icons.receipt_long_outlined),
          selectedIcon: const Icon(Icons.receipt_long),
          label: l.navFines,
        ),
        NavigationDestination(
          icon: const Icon(Icons.person_outline),
          selectedIcon: const Icon(Icons.person),
          label: l.navProfile,
        ),
      ],
      child: child,
    );
  }
}
