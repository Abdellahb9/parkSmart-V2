import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? _user;
  String? _token;
  bool _loading = false;

  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get loading => _loading;
  bool get isAuthenticated => _token != null;
  String get role => _user?['role'] ?? '';

  AuthProvider() {
    _loadFromPrefs();
  }

  Future<void> _loadFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    final userData = prefs.getString('auth_user');
    if (_token != null && userData != null) {
      try {
        _user = Map<String, dynamic>.from(
          Uri.splitQueryString(userData).isEmpty
              ? {} // fallback
              : _parseUserData(userData),
        );
      } catch (_) {
        // If parsing fails, clear stored data
        await _clearPrefs();
      }
    }
    notifyListeners();
  }

  Map<String, dynamic> _parseUserData(String data) {
    // Simple key-value parsing
    final parts = data.split('|||');
    final map = <String, dynamic>{};
    for (final part in parts) {
      final idx = part.indexOf('=');
      if (idx > 0) {
        map[part.substring(0, idx)] = part.substring(idx + 1);
      }
    }
    return map;
  }

  String _serializeUser(Map<String, dynamic> user) {
    return user.entries.map((e) => '${e.key}=${e.value}').join('|||');
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    _loading = true;
    notifyListeners();

    try {
      final data = await ApiService.post('/auth/login', {
        'email': email,
        'password': password,
      });

      _user = Map<String, dynamic>.from(data['user']);
      _token = data['token'];

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('auth_user', _serializeUser(_user!));

      _loading = false;
      notifyListeners();
      return _user!;
    } catch (e) {
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<Map<String, dynamic>> register(String fullName, String email, String password, String phone) async {
    _loading = true;
    notifyListeners();

    try {
      final data = await ApiService.post('/auth/register', {
        'fullName': fullName,
        'email': email,
        'password': password,
        'phone': phone,
      });

      _user = Map<String, dynamic>.from(data['user']);
      _token = data['token'];

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('auth_user', _serializeUser(_user!));

      _loading = false;
      notifyListeners();
      return _user!;
    } catch (e) {
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    await _clearPrefs();
    _user = null;
    _token = null;
    notifyListeners();
  }

  Future<void> _clearPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('auth_user');
  }
}
