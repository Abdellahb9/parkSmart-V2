import '../core/api_service.dart';
import '../models/models.dart';

/// Thin typed layer over the API. Screens depend on these, never on raw maps.

typedef AuthSession = ({String token, String? refreshToken, AppUser user});

class AuthRepository {
  const AuthRepository();

  /// Asks for a 15-minute access token plus a refresh token, instead of the
  /// single 7-day token older builds receive.
  static const _refreshMode = {'X-Auth-Mode': 'refresh'};

  AuthSession _session(Map<String, dynamic> data) => (
        token: asString(data['token']),
        refreshToken: data['refreshToken'] is String ? data['refreshToken'] as String : null,
        user: AppUser.fromJson(asMap(data['user'])),
      );

  Future<AuthSession> login(String email, String password) async => _session(asMap(
        await ApiService.post('/auth/login', {'email': email, 'password': password}, headers: _refreshMode),
      ));

  Future<AuthSession> register({
    required String fullName,
    required String email,
    required String password,
    required String phone,
  }) async =>
      _session(asMap(await ApiService.post(
        '/auth/register',
        {'fullName': fullName, 'email': email, 'password': password, 'phone': phone},
        headers: _refreshMode,
      )));

  Future<AppUser> me() async => AppUser.fromJson(asMap(await ApiService.get('/auth/me')));

  /// Signs every other device out; this one receives a fresh session.
  Future<AuthSession> changePassword(String currentPassword, String newPassword) async => _session(asMap(
        await ApiService.post(
          '/auth/change-password',
          {'currentPassword': currentPassword, 'newPassword': newPassword},
          headers: _refreshMode,
        ),
      ));

  Future<void> logoutAll() async => ApiService.post('/auth/logout-all', const {});

  /// Ends this device's session on the server. Never throws: signing out
  /// locally must work offline too.
  Future<void> logout(String? refreshToken) async {
    if (refreshToken == null) return;
    try {
      await ApiService.post('/auth/logout', {'refreshToken': refreshToken});
    } catch (_) {
      // The token expires on its own; nothing else to do.
    }
  }
}

class ParkingRepository {
  const ParkingRepository();

  Future<List<Parking>> list() async {
    final raw = await ApiService.get('/parkings');
    return (raw is List ? raw.whereType<Map>().map(asMap) : <Map<String, dynamic>>[])
        .map(Parking.fromJson)
        .toList();
  }

  Future<Parking> byId(String id) async => Parking.fromJson(asMap(await ApiService.get('/parkings/$id')));

  /// Spot grid for the booking flow.
  ///
  /// Without a window, each spot says what it is doing right now. With [from]
  /// and [to], it says whether it is free for that window — a spot booked
  /// from 18:00 is still bookable at 14:00, and one free now may be taken
  /// tonight.
  Future<Parking> spots(String id, {DateTime? from, DateTime? to}) async {
    final window = (from != null && to != null)
        ? '?${Uri(queryParameters: {
            'from': from.toUtc().toIso8601String(),
            'to': to.toUtc().toIso8601String(),
          }).query}'
        : '';
    return Parking.fromJson(asMap(await ApiService.get('/parkings/$id/spots$window')));
  }
}

class BookingRepository {
  const BookingRepository();

  Future<List<Booking>> mine() async {
    final raw = await ApiService.get('/reservations');
    return (raw is List ? raw.whereType<Map>().map(asMap) : <Map<String, dynamic>>[])
        .map(Booking.fromJson)
        .toList();
  }

  /// The server recomputes the price; its answer is what we show afterwards.
  Future<Booking> create(BookingDraft draft) async {
    final data = asMap(await ApiService.post('/bookings', {
      'parkingId': draft.parkingId,
      'spotNumber': draft.spotNumber,
      'carPlate': draft.carPlate,
      'startTime': draft.start.toUtc().toIso8601String(),
      'endTime': draft.end.toUtc().toIso8601String(),
    }));
    return Booking.fromJson(data);
  }

  /// Pushes the end time back. The server recomputes the total and tells
  /// us what the extension cost.
  Future<Booking> byId(String id) async =>
      Booking.fromJson(asMap(await ApiService.get('/bookings/$id')));

  /// Validates an entry from the QR token alone — what the scanner has.
  Future<({Booking booking, String parkingName})> checkInByToken(String qrToken) async {
    final data = asMap(await ApiService.post('/bookings/check-in', {'qrToken': qrToken}));
    return (
      booking: Booking.fromJson(asMap(data['booking'])),
      parkingName: asString(data['parkingName']),
    );
  }

  Future<({Booking booking, double addedPrice})> extend(String id, DateTime newEnd) async {
    final data = asMap(await ApiService.patch('/bookings/$id/extend', {
      'newEndTime': newEnd.toUtc().toIso8601String(),
    }));
    return (
      booking: Booking.fromJson(asMap(data['booking'])),
      addedPrice: asDouble(data['addedPrice']),
    );
  }

  /// Returns the cancellation fee the server actually applied.
  Future<double> cancel(String id) async {
    final data = asMap(await ApiService.patch('/bookings/$id/cancel'));
    return asDouble(data['cancellationFee']);
  }
}

class ComplaintRepository {
  const ComplaintRepository();

  Future<List<Complaint>> mine() async {
    final raw = await ApiService.get('/complaints');
    return (raw is List ? raw.whereType<Map>().map(asMap) : <Map<String, dynamic>>[])
        .map(Complaint.fromJson)
        .toList();
  }

  Future<void> create({required String parkingId, required String message}) =>
      ApiService.post('/complaints', {'parkingId': parkingId, 'message': message});
}

class RewardRepository {
  const RewardRepository();

  Future<RewardsBundle> fetch() async => RewardsBundle.fromJson(asMap(await ApiService.get('/rewards')));
}

class TechnicianRepository {
  const TechnicianRepository();

  Future<List<StreetParking>> streets() async {
    final raw = await ApiService.get('/technicien/streets');
    return (raw is List ? raw.whereType<Map>().map(asMap) : <Map<String, dynamic>>[])
        .map(StreetParking.fromJson)
        .toList();
  }

  Future<List<StreetSpot>> spots(String parkingId) async {
    final data = asMap(await ApiService.get('/technicien/streets/$parkingId/spots'));
    return asMapList(data['spots']).map(StreetSpot.fromJson).toList();
  }

  /// With [photoPath], the fine goes out as multipart with the photo as
  /// evidence; without, as the same JSON as before.
  Future<Fine> issueFine({
    required String streetParkingId,
    required String carPlate,
    required String reason,
    int? spotNumber,
    String? photoPath,
  }) async {
    final fields = {
      'streetParkingId': streetParkingId,
      'carPlate': carPlate,
      'reason': reason,
      // Previously dropped on the floor, so a fine could not be traced to a spot.
      if (spotNumber != null) 'spotNumber': '$spotNumber',
    };
    final raw = photoPath == null
        ? await ApiService.post('/technicien/fines', {
            ...fields,
            if (spotNumber != null) 'spotNumber': spotNumber,
          })
        : await ApiService.postMultipart(
            '/technicien/fines',
            fields: fields,
            fileField: 'photo',
            filePath: photoPath,
          );
    return Fine.fromJson(asMap(raw));
  }

  String finePhotoUrl(String fineId) => ApiService.url('/technicien/fines/$fineId/photo');

  Future<List<Fine>> fines() async {
    final raw = await ApiService.get('/technicien/fines');
    return (raw is List ? raw.whereType<Map>().map(asMap) : <Map<String, dynamic>>[])
        .map(Fine.fromJson)
        .toList();
  }
}

/// Wallet, charges and refunds.
class PaymentRepository {
  const PaymentRepository();

  Future<Wallet> wallet() async => Wallet.fromJson(asMap(await ApiService.get('/payments/wallet')));

  Future<List<Payment>> mine() async {
    final raw = await ApiService.get('/payments/my');
    return (raw is List ? raw.whereType<Map>().map(asMap) : <Map<String, dynamic>>[])
        .map(Payment.fromJson)
        .toList();
  }

  /// Starts a top-up. The charge is only pending here — [confirm] settles it,
  /// standing in for the gateway's callback.
  Future<Payment> topUp(double amount) async {
    final data = asMap(await ApiService.post('/payments/topup', {'amount': amount}));
    return Payment.fromJson(asMap(data['payment']));
  }

  /// Pays for a stay. A wallet payment comes back already settled; a card
  /// payment comes back pending and needs [confirm].
  Future<({Payment payment, Booking booking})> payBooking(
    String bookingId,
    PaymentMethod method,
  ) async {
    final data = asMap(
      await ApiService.post('/payments/booking/$bookingId', {'method': method.wire}),
    );
    return (
      payment: Payment.fromJson(asMap(data['payment'])),
      booking: Booking.fromJson(asMap(data['booking'])),
    );
  }

  Future<Payment> confirm(String paymentId, {bool succeed = true}) async {
    final data = asMap(
      await ApiService.post('/payments/$paymentId/confirm', {
        if (!succeed) 'outcome': 'failure',
      }),
    );
    return Payment.fromJson(asMap(data['payment']));
  }
}

// Shared instances; these hold no state.
const authRepo = AuthRepository();
const parkingRepo = ParkingRepository();
const bookingRepo = BookingRepository();
const complaintRepo = ComplaintRepository();
const rewardRepo = RewardRepository();
const technicianRepo = TechnicianRepository();
const paymentRepo = PaymentRepository();
