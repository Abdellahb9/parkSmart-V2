import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;

import 'api_service.dart';
import 'constants.dart';
import 'token_storage.dart';

/// Live availability over socket.io.
///
/// Connects to the same origin as the REST API, authenticated with the same
/// JWT. Deliberately tolerant: if the socket never connects the app keeps
/// working exactly as before, just without live updates.
class RealtimeService extends ChangeNotifier {
  socket_io.Socket? _socket;
  bool _connected = false;
  String? _account;
  final Set<String> _rooms = {};

  bool get connected => _connected;

  /// parkingId -> available spots, as last broadcast by the server.
  final Map<String, int> availability = {};

  static String get _origin {
    // ApiConfig.baseUrl ends with /api; the socket lives at the origin.
    const base = ApiConfig.baseUrl;
    final idx = base.lastIndexOf('/api');
    return idx > 0 ? base.substring(0, idx) : base;
  }

  /// Safe to call on every screen mount: it reconnects only when the signed-in
  /// account has changed, and tears the socket down once the session is gone.
  ///
  /// Keyed on the account, not the token: the access token is renewed every
  /// 15 minutes, which must not tear down a working socket.
  Future<void> connect() async {
    final token = await TokenStorage.readToken();
    final account = (await TokenStorage.readUser())?['_id']?.toString();
    if (token == null || account == null) {
      disconnectSocket();
      return;
    }
    if (_socket != null && _account == account) return;
    if (_socket != null) disconnectSocket();
    _account = account;

    final socket = socket_io.io(
      '$_origin/rt',
      socket_io.OptionBuilder()
          .setTransports(['websocket'])
          // Read at every (re)connection, so it is always the current token.
          .setAuthFn((callback) {
            TokenStorage.readToken().then((current) => callback({'token': current ?? ''}));
          })
          .enableReconnection()
          .build(),
    );

    var retriedAuth = false;
    socket.onConnect((_) {
      retriedAuth = false;
      _connected = true;
      // Re-join after a reconnect; the server keeps no subscription state.
      if (_rooms.isNotEmpty) {
        socket.emit('subscribe:parkings', {'ids': _rooms.toList()});
      }
      notifyListeners();
    });
    socket.onDisconnect((_) {
      _connected = false;
      notifyListeners();
    });
    socket.onConnectError((error) async {
      _connected = false;
      notifyListeners();
      // The handshake refused an expired token. The client does not retry
      // after a refusal, so renew the session once and reconnect ourselves.
      final refused = error is Map ? error['message'] == 'UNAUTHORIZED' : '$error'.contains('UNAUTHORIZED');
      if (refused && !retriedAuth) {
        retriedAuth = true;
        if (await ApiService.refreshSession() == RefreshOutcome.refreshed) socket.connect();
      }
    });

    socket.on('availability:update', (data) {
      if (data is! Map) return;
      final id = data['parkingId']?.toString();
      final available = data['availableSpots'];
      if (id == null || available is! int) return;
      availability[id] = available;
      notifyListeners();
    });

    _socket = socket;
  }

  void subscribe(List<String> parkingIds) {
    if (parkingIds.isEmpty) return;
    final ids = parkingIds.take(50).toList();
    _rooms
      ..clear()
      ..addAll(ids);
    _socket?.emit('subscribe:parkings', {'ids': ids});
  }

  void disconnectSocket() {
    _socket?.dispose();
    _socket = null;
    _connected = false;
    _account = null;
    _rooms.clear();
    availability.clear();
    notifyListeners();
  }

  @override
  void dispose() {
    _socket?.dispose();
    _socket = null;
    super.dispose();
  }
}
