import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';
import '../repositories/repositories.dart';
import 'api_service.dart';
import 'token_storage.dart';

/// Session state for the whole app.
///
/// Replaces the previous hand-rolled string encoding, the plaintext token, and
/// the complete absence of 401 handling that left the app in a silent zombie
/// session once the 7-day token expired.
class AuthProvider extends ChangeNotifier {
  static const _onboardingKey = 'onboarding_seen';

  AppUser? _user;
  String? _token;
  bool _loading = false;
  bool _bootstrapped = false;
  bool _onboardingSeen = false;

  AppUser? get user => _user;
  bool get loading => _loading;

  /// False until the stored session has been read, so the splash can hold the
  /// router instead of flashing the login screen on every cold start.
  bool get bootstrapped => _bootstrapped;
  bool get onboardingSeen => _onboardingSeen;
  bool get isAuthenticated => _token != null && _user != null;
  String get role => _user?.role ?? '';

  AuthProvider() {
    ApiService.onUnauthorized = _handleUnauthorized;
    _restore();
  }

  Future<void> _restore() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _onboardingSeen = prefs.getBool(_onboardingKey) ?? false;
    } catch (_) {
      _onboardingSeen = false;
    }

    try {
      final token = await TokenStorage.readToken();
      final userJson = await TokenStorage.readUser();
      if (token != null && userJson != null) {
        _token = token;
        _user = AppUser.fromJson(userJson);
      }
    } catch (_) {
      await TokenStorage.clear();
    }

    _bootstrapped = true;
    notifyListeners();

    if (_token == null) return;

    // Confirm the session and refresh the role from the server.
    try {
      final fresh = await authRepo.me();
      _user = fresh;
      await TokenStorage.saveUser(fresh.toJson());
      notifyListeners();
    } on ApiException catch (e) {
      if (e.isUnauthorized) await logout();
      // Offline or server down: keep the cached session rather than
      // throwing the user out for a network blip.
    } catch (_) {
      // Same.
    }
  }

  void _handleUnauthorized() {
    if (isAuthenticated) logout();
  }

  Future<AppUser> login(String email, String password) async {
    _loading = true;
    notifyListeners();
    try {
      final session = await authRepo.login(email, password);
      await _apply(session);
      return session.user;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<AppUser> register({
    required String fullName,
    required String email,
    required String password,
    required String phone,
  }) async {
    _loading = true;
    notifyListeners();
    try {
      final result = await authRepo.register(
        fullName: fullName,
        email: email,
        password: password,
        phone: phone,
      );
      await _apply(result);
      return result.user;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> _apply(AuthSession session) async {
    _token = session.token;
    _user = session.user;
    await TokenStorage.save(token: session.token, refreshToken: session.refreshToken, user: session.user.toJson());
  }

  Future<void> logout() async {
    // Read before clearing, then end the session on the server without
    // making the user wait for it.
    final refreshToken = await TokenStorage.readRefreshToken();
    await TokenStorage.clear();
    _user = null;
    _token = null;
    notifyListeners();
    unawaited(authRepo.logout(refreshToken));
  }

  /// Changes the password; every other device is signed out by the server and
  /// this one continues on the fresh session it hands back.
  Future<void> changePassword(String currentPassword, String newPassword) async {
    final session = await authRepo.changePassword(currentPassword, newPassword);
    await _apply(session);
    notifyListeners();
  }

  /// Signs out every device, this one included.
  Future<void> logoutEverywhere() async {
    await authRepo.logoutAll();
    await TokenStorage.clear();
    _user = null;
    _token = null;
    notifyListeners();
  }

  Future<void> completeOnboarding() async {
    _onboardingSeen = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_onboardingKey, true);
    } catch (_) {
      // Not persisting just means it shows again next launch.
    }
  }
}
