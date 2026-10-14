import 'json.dart';

enum BookingStatus { pending, active, done, cancelled, unknown }

BookingStatus bookingStatusFrom(String raw) => switch (raw) {
      'pending' => BookingStatus.pending,
      'active' => BookingStatus.active,
      'done' => BookingStatus.done,
      'cancelled' => BookingStatus.cancelled,
      _ => BookingStatus.unknown,
    };

class Booking {
  final String id;
  final String parkingId;
  final String? parkingName;
  final int spotNumber;
  final String carPlate;
  final DateTime? startTime;
  final DateTime? endTime;
  final int totalHours;
  final double totalPrice;
  final BookingStatus status;
  final double cancellationFee;

  /// 'unpaid' | 'pending' | 'paid' | 'refunded'. Defaulted server-side, so
  /// a booking made before payments existed reads as unpaid.
  final String paymentStatus;

  /// Opaque token the owner or technician validates at entry.
  final String? qrToken;

  const Booking({
    required this.id,
    required this.parkingId,
    required this.spotNumber,
    required this.carPlate,
    required this.totalHours,
    required this.totalPrice,
    required this.status,
    this.parkingName,
    this.startTime,
    this.endTime,
    this.cancellationFee = 0,
    this.qrToken,
    this.paymentStatus = 'unpaid',
  });

  bool get isActive => status == BookingStatus.active;

  bool get isPaid => paymentStatus == 'paid';

  bool get awaitsCash => paymentStatus == 'pending';

  /// Seconds left before the booking ends; negative once it has overrun.
  int get secondsRemaining =>
      endTime == null ? 0 : endTime!.difference(DateTime.now()).inSeconds;

  bool get isOverstay => isActive && secondsRemaining < 0;

  /// Progress through the booking, clamped to 0..1.
  ///
  /// Measured from startTime, not from "now minus totalHours" — the old ring
  /// assumed every booking had already started and sat full until it did.
  double get progress {
    final start = startTime;
    final end = endTime;
    if (start == null || end == null) return 0;
    final total = end.difference(start).inSeconds;
    if (total <= 0) return 1;
    final elapsed = DateTime.now().difference(start).inSeconds;
    return (elapsed / total).clamp(0.0, 1.0);
  }

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
        id: asString(json['_id']),
        parkingId: refId(json['parkingId']),
        parkingName: refField(json['parkingId'], 'name'),
        spotNumber: asInt(json['spotNumber']),
        carPlate: asString(json['carPlate']),
        startTime: asDate(json['startTime']),
        endTime: asDate(json['endTime']),
        totalHours: asInt(json['totalHours']),
        totalPrice: asDouble(json['totalPrice']),
        status: bookingStatusFrom(asString(json['status'])),
        cancellationFee: asDouble(json['cancellationFee']),
        qrToken: asStringOrNull(json['qrToken']),
        paymentStatus: asString(json['paymentStatus'], 'unpaid'),
      );
}

/// What the booking stepper carries between its steps.
///
/// Replaces `state.extra as Map<String, dynamic>`, an unguarded cast that
/// crashed on a deep link, a hot restart, or a back-forward navigation.
class BookingDraft {
  final String parkingId;
  final String parkingName;
  final double pricePerHour;
  final int spotNumber;
  final String carPlate;
  final DateTime start;
  final DateTime end;

  const BookingDraft({
    required this.parkingId,
    required this.parkingName,
    required this.pricePerHour,
    required this.spotNumber,
    this.carPlate = '',
    required this.start,
    required this.end,
  });

  Duration get duration => end.difference(start);

  /// Billed per started hour, mirroring the server's rule.
  int get billableHours {
    final minutes = duration.inMinutes;
    if (minutes <= 0) return 1;
    return (minutes / 60).ceil().clamp(1, 24 * 30);
  }

  /// Client-side estimate only. The server recomputes and its figure wins.
  double get estimatedPrice => billableHours * pricePerHour;

  bool get isRangeValid => end.isAfter(start);

  BookingDraft copyWith({int? spotNumber, String? carPlate, DateTime? start, DateTime? end}) => BookingDraft(
        parkingId: parkingId,
        parkingName: parkingName,
        pricePerHour: pricePerHour,
        spotNumber: spotNumber ?? this.spotNumber,
        carPlate: carPlate ?? this.carPlate,
        start: start ?? this.start,
        end: end ?? this.end,
      );
}
