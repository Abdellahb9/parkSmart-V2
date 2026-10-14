import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../l10n/l10n.dart';
import 'constants.dart';
import 'token_storage.dart';

class ApiService {
  // Without this an unreachable host hangs until the OS gives up (~2 min),
  // leaving the caller on an infinite spinner with no way out.
  static const Duration _timeout = Duration(seconds: 15);

  /// Called when the API rejects the session, so the app can log out instead
  /// of sitting in a zombie session where every screen is silently empty.
  static void Function()? onUnauthorized;

  static Future<Map<String, String>> _headers() async {
    final token = await TokenStorage.readToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      // The API words its messages in this language (fr | ar).
      'X-App-Language': L10n.code,
    };
  }

  static Uri _uri(String endpoint) => Uri.parse('${ApiConfig.baseUrl}$endpoint');

  static Future<dynamic> get(String endpoint) =>
      _send(endpoint, () async => http.get(_uri(endpoint), headers: await _headers()));

  static Future<dynamic> post(String endpoint, Map<String, dynamic> body, {Map<String, String>? headers}) =>
      _send(
        endpoint,
        () async => http.post(
          _uri(endpoint),
          headers: {...await _headers(), ...?headers},
          body: jsonEncode(body),
        ),
      );

  static Future<dynamic> patch(String endpoint, [Map<String, dynamic>? body]) => _send(
        endpoint,
        () async => http.patch(
          _uri(endpoint),
          headers: await _headers(),
          body: body != null ? jsonEncode(body) : null,
        ),
      );

  /// Multipart POST, for the one upload in the app (fine photo evidence).
  /// Text fields travel as form fields; the server reads them exactly like
  /// JSON, so the endpoint serves both shapes.
  static Future<dynamic> postMultipart(
    String endpoint, {
    required Map<String, String> fields,
    String? fileField,
    String? filePath,
  }) =>
      _send(endpoint, () async {
        final request = http.MultipartRequest('POST', _uri(endpoint));
        final headers = await _headers();
        // http sets its own multipart boundary content type.
        headers.remove('Content-Type');
        request.headers.addAll(headers);
        request.fields.addAll(fields);
        if (fileField != null && filePath != null) {
          request.files.add(await http.MultipartFile.fromPath(
            fileField,
            filePath,
            contentType: MediaType('image', 'jpeg'),
          ));
        }
        // Uploads get longer than the JSON timeout on a slow connection.
        return http.Response.fromStream(await request.send().timeout(const Duration(seconds: 60)));
      });

  /// For an image fetched with the session token (Image.network headers).
  static Future<Map<String, String>> authHeaders() async {
    final token = await TokenStorage.readToken();
    return {if (token != null) 'Authorization': 'Bearer $token'};
  }

  static String url(String endpoint) => _uri(endpoint).toString();

  // Every transport failure becomes an ApiException carrying a message that is
  // safe to show. Raw SocketException text leaked the server host and port
  // straight into the UI.
  static Future<dynamic> _send(String endpoint, Future<http.Response> Function() run, {bool retried = false}) async {
    try {
      final response = await run().timeout(_timeout);
      // The 15-minute access token ran out: renew it once and replay the
      // request (run() reads the token again), so the user never notices.
      if (response.statusCode == 401 && !retried && !_isAuthCall(endpoint)) {
        final outcome = await refreshSession();
        if (outcome == RefreshOutcome.refreshed) return _send(endpoint, run, retried: true);
        // Offline is not "signed out": keep the session and say so.
        if (outcome == RefreshOutcome.unreachable) throw ApiException(L10n.current.errNetwork, 0);
      }
      return _handleResponse(endpoint, response);
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw ApiException(L10n.current.errTimeout, 0);
    } on SocketException {
      throw ApiException(L10n.current.errNetwork, 0);
    } on http.ClientException {
      throw ApiException(L10n.current.errNetwork, 0);
    } on FormatException {
      throw ApiException(L10n.current.errInvalidResponse, 0);
    }
  }

  static bool _isAuthCall(String endpoint) =>
      endpoint.startsWith('/auth/login') ||
      endpoint.startsWith('/auth/register') ||
      endpoint.startsWith('/auth/refresh') ||
      endpoint.startsWith('/auth/logout');

  static Future<RefreshOutcome>? _refreshing;

  /// Trades the stored refresh token for a new pair. Concurrent callers share
  /// one request: three screens hitting a 401 at once must not rotate the
  /// token three times (the second use of a rotated token ends the session).
  static Future<RefreshOutcome> refreshSession() =>
      _refreshing ??= _refresh().whenComplete(() => _refreshing = null);

  static Future<RefreshOutcome> _refresh() async {
    final refreshToken = await TokenStorage.readRefreshToken();
    if (refreshToken == null) return RefreshOutcome.rejected;
    try {
      final response = await http
          .post(
            _uri('/auth/refresh'),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-App-Language': L10n.code,
            },
            body: jsonEncode({'refreshToken': refreshToken}),
          )
          .timeout(_timeout);
      if (response.statusCode != 200) {
        // 401: the session is over. Anything else (a 5xx, a proxy page) is
        // the server's problem, not a reason to sign the user out.
        return response.statusCode == 401 ? RefreshOutcome.rejected : RefreshOutcome.unreachable;
      }
      final data = jsonDecode(response.body);
      if (data is! Map || data['token'] is! String) return RefreshOutcome.unreachable;
      await TokenStorage.saveTokens(
        token: data['token'] as String,
        refreshToken: data['refreshToken'] is String ? data['refreshToken'] as String : null,
      );
      return RefreshOutcome.refreshed;
    } on TimeoutException {
      return RefreshOutcome.unreachable;
    } on SocketException {
      return RefreshOutcome.unreachable;
    } on http.ClientException {
      return RefreshOutcome.unreachable;
    } on FormatException {
      return RefreshOutcome.unreachable;
    }
  }

  static dynamic _handleResponse(String endpoint, http.Response response) {
    final isSuccess = response.statusCode >= 200 && response.statusCode < 300;

    // Decode defensively: an empty body (204), an HTML error page from a proxy,
    // or plain text would otherwise throw before the status was ever checked.
    dynamic data;
    if (response.body.isNotEmpty) {
      try {
        data = jsonDecode(response.body);
      } catch (_) {
        data = null;
      }
    }

    if (isSuccess) return data;

    // A 401 from the login call itself means "wrong credentials" and belongs
    // to the form; anywhere else it means the session is gone.
    final isAuthAttempt = endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register');
    if (response.statusCode == 401 && !isAuthAttempt) onUnauthorized?.call();

    String message = L10n.current.errGeneric(response.statusCode);
    if (data is Map) {
      final map = data.map((k, v) => MapEntry(k.toString(), v));
      if (map['message'] is String) message = map['message'] as String;
      // express-validator returns the useful detail in `errors`.
      final errors = map['errors'];
      if (errors is List && errors.isNotEmpty) {
        final details = errors
            .whereType<Map>()
            .map((e) => e['message'])
            .whereType<String>()
            .join(' · ');
        if (details.isNotEmpty) message = details;
      }
    }
    throw ApiException(message, response.statusCode);
  }
}

enum RefreshOutcome { refreshed, rejected, unreachable }

class ApiException implements Exception {
  final String message;

  /// HTTP status, or 0 when the request never reached the server.
  final int statusCode;

  ApiException(this.message, this.statusCode);

  bool get isNetworkError => statusCode == 0;
  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => message;
}
