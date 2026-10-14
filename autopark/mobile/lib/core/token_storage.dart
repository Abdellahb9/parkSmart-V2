import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Session storage.
///
/// Both tokens live in the platform keystore rather than SharedPreferences,
/// where the old 7-day token sat in clear text and was picked up by device
/// backups. The access token now lasts 15 minutes; the refresh token renews
/// it and is replaced on every use, so a copied one stops working the next
/// time either copy is used.
///
/// The user object is stored as real JSON, which replaces a hand-rolled
/// `|||`/`=` encoding that corrupted any value containing its delimiters.
class TokenStorage {
  static const _secure = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  static const _tokenKey = 'auth_token';
  static const _refreshKey = 'auth_refresh_token';
  static const _userKey = 'auth_user';

  static Future<String?> readToken() async {
    final existing = await _secure.read(key: _tokenKey);
    if (existing != null) return existing;
    return _migrateLegacyToken();
  }

  static Future<String?> readRefreshToken() => _secure.read(key: _refreshKey);

  static Future<Map<String, dynamic>?> readUser() async {
    final raw = await _secure.read(key: _userKey);
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw);
      return decoded is Map ? decoded.map((k, v) => MapEntry(k.toString(), v)) : null;
    } catch (_) {
      await clear();
      return null;
    }
  }

  static Future<void> save({
    required String token,
    required Map<String, dynamic> user,
    String? refreshToken,
  }) async {
    await saveTokens(token: token, refreshToken: refreshToken);
    await _secure.write(key: _userKey, value: jsonEncode(user));
  }

  /// After a refresh: a new access token and the refresh token that replaced
  /// the one just used.
  static Future<void> saveTokens({required String token, String? refreshToken}) async {
    await _secure.write(key: _tokenKey, value: token);
    if (refreshToken != null) await _secure.write(key: _refreshKey, value: refreshToken);
  }

  /// Updates the cached profile without touching the tokens, which a
  /// background refresh may have replaced in the meantime.
  static Future<void> saveUser(Map<String, dynamic> user) =>
      _secure.write(key: _userKey, value: jsonEncode(user));

  static Future<void> clear() async {
    await _secure.delete(key: _tokenKey);
    await _secure.delete(key: _refreshKey);
    await _secure.delete(key: _userKey);
  }

  /// Moves a token written by an older build into secure storage once, then
  /// deletes the plaintext copy.
  static Future<String?> _migrateLegacyToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final legacy = prefs.getString('auth_token');
      if (legacy == null) return null;
      await _secure.write(key: _tokenKey, value: legacy);
      await prefs.remove('auth_token');
      await prefs.remove('auth_user');
      return legacy;
    } catch (_) {
      return null;
    }
  }
}
