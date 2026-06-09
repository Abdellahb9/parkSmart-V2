import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'auth_provider.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/map/map_screen.dart';
import '../features/booking/spot_selection_screen.dart';
import '../features/booking/booking_details_screen.dart';
import '../features/booking/booking_confirm_screen.dart';
import '../features/reservations/reservations_screen.dart';
import '../features/complaints/complaints_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/technicien/streets_screen.dart';
import '../features/technicien/tech_profile_screen.dart';
import 'constants.dart';

class AppRouter {
  static GoRouter router(AuthProvider authProvider) {
    return GoRouter(
      initialLocation: '/login',
      redirect: (context, state) {
        final loggedIn = authProvider.isAuthenticated;
        final loggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/register';

        if (!loggedIn && !loggingIn) return '/login';
        if (loggedIn && loggingIn) {
          if (authProvider.role == 'technicien') return '/technicien';
          return '/map';
        }
        return null;
      },
      routes: [
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),

        // User shell with bottom nav
        ShellRoute(
          builder: (context, state, child) => UserShell(child: child),
          routes: [
            GoRoute(path: '/map', builder: (_, __) => const MapScreen()),
            GoRoute(path: '/reservations', builder: (_, __) => const ReservationsScreen()),
            GoRoute(path: '/complaints', builder: (_, __) => const ComplaintsScreen()),
            GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          ],
        ),

        // Booking flow (not in bottom nav)
        GoRoute(path: '/booking/spots/:parkingId', builder: (_, state) => SpotSelectionScreen(parkingId: state.pathParameters['parkingId']!)),
        GoRoute(path: '/booking/details/:parkingId/:spotNumber', builder: (_, state) => BookingDetailsScreen(parkingId: state.pathParameters['parkingId']!, spotNumber: int.parse(state.pathParameters['spotNumber']!))),
        GoRoute(path: '/booking/confirm', builder: (_, state) => BookingConfirmScreen(bookingData: state.extra as Map<String, dynamic>)),

        // Technicien shell
        ShellRoute(
          builder: (context, state, child) => TechShell(child: child),
          routes: [
            GoRoute(path: '/technicien', builder: (_, __) => const StreetsScreen()),
            GoRoute(path: '/technicien/profile', builder: (_, __) => const TechProfileScreen()),
          ],
        ),
      ],
    );
  }
}

// Bottom navigation shell for User
class UserShell extends StatelessWidget {
  final Widget child;
  const UserShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    int currentIndex = 0;
    if (location.startsWith('/reservations')) currentIndex = 1;
    if (location.startsWith('/complaints')) currentIndex = 2;
    if (location.startsWith('/profile')) currentIndex = 3;

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (i) {
          const routes = ['/map', '/reservations', '/complaints', '/profile'];
          context.go(routes[i]);
        },
        backgroundColor: Colors.white,
        indicatorColor: AppColors.primary.withValues(alpha: 0.1),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.map_outlined), selectedIcon: Icon(Icons.map, color: AppColors.primary), label: 'Carte'),
          NavigationDestination(icon: Icon(Icons.calendar_today_outlined), selectedIcon: Icon(Icons.calendar_today, color: AppColors.primary), label: 'Réservations'),
          NavigationDestination(icon: Icon(Icons.chat_outlined), selectedIcon: Icon(Icons.chat, color: AppColors.primary), label: 'Réclamations'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person, color: AppColors.primary), label: 'Profil'),
        ],
      ),
    );
  }
}

// Bottom navigation shell for Technicien
class TechShell extends StatelessWidget {
  final Widget child;
  const TechShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    int currentIndex = location.startsWith('/technicien/profile') ? 1 : 0;

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (i) {
          const routes = ['/technicien', '/technicien/profile'];
          context.go(routes[i]);
        },
        backgroundColor: Colors.white,
        indicatorColor: AppColors.primary.withValues(alpha: 0.1),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.local_parking_outlined), selectedIcon: Icon(Icons.local_parking, color: AppColors.primary), label: 'Rues'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person, color: AppColors.primary), label: 'Profil'),
        ],
      ),
    );
  }
}
