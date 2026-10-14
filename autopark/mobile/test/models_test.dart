import 'package:autopark_mobile/models/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('BookingDraft (client-side estimate)', () {
    BookingDraft draft(DateTime start, DateTime end) => BookingDraft(
          parkingId: 'p1',
          parkingName: 'Parking Al Massira',
          pricePerHour: 8,
          spotNumber: 4,
          start: start,
          end: end,
        );

    test('an overnight stay is four hours, not minus twenty', () {
      // The old screens pinned both ends to today, so 22:00 -> 02:00 inverted.
      final d = draft(DateTime(2026, 10, 14, 22), DateTime(2026, 10, 15, 2));
      expect(d.isRangeValid, isTrue);
      expect(d.billableHours, 4);
      expect(d.estimatedPrice, 32);
    });

    test('every started hour is billed, like the server', () {
      final d = draft(DateTime(2026, 10, 14, 9), DateTime(2026, 10, 14, 10, 5));
      expect(d.billableHours, 2);
      expect(d.estimatedPrice, 16);
    });

    test('a reversed range is invalid and never billed as negative', () {
      final d = draft(DateTime(2026, 10, 14, 12), DateTime(2026, 10, 14, 10));
      expect(d.isRangeValid, isFalse);
      expect(d.billableHours, 1);
    });
  });

  group('Booking.fromJson', () {
    test('reads a populated parking and the payment fields', () {
      final b = Booking.fromJson({
        '_id': 'b1',
        'parkingId': {'_id': 'p1', 'name': 'Parking Centre Ville'},
        'spotNumber': 3,
        'carPlate': '12345-A-61',
        'startTime': '2026-10-14T09:00:00.000Z',
        'endTime': '2026-10-14T11:00:00.000Z',
        'totalHours': 2,
        'totalPrice': 20,
        'status': 'active',
        'paymentStatus': 'paid',
        'qrToken': 'abc',
      });
      expect(b.parkingId, 'p1');
      expect(b.parkingName, 'Parking Centre Ville');
      expect(b.isActive, isTrue);
      expect(b.isPaid, isTrue);
      // Shown in local time, but the same instant the server sent.
      expect(b.startTime!.isUtc, isFalse);
      expect(b.startTime!.toUtc(), DateTime.utc(2026, 10, 14, 9));
    });

    test('a booking from before payments existed reads as unpaid', () {
      final b = Booking.fromJson({'_id': 'b2', 'parkingId': 'p1', 'status': 'done'});
      expect(b.paymentStatus, 'unpaid');
      expect(b.status, BookingStatus.done);
      expect(b.totalPrice, 0);
    });

    test('an unknown status does not crash the list', () {
      expect(Booking.fromJson({'_id': 'b3', 'status': 'archived'}).status, BookingStatus.unknown);
    });
  });

  group('Parking.fromJson', () {
    test('GeoJSON is [longitude, latitude]', () {
      final p = Parking.fromJson({
        '_id': 'p1',
        'name': 'Parking Al Massira',
        'location': {
          'type': 'Point',
          'coordinates': [-13.2033, 27.1536],
        },
      });
      expect(p.latitude, 27.1536);
      expect(p.longitude, -13.2033);
      expect(p.hasPosition, isTrue);
    });

    test('free spots are counted from the spot list when no total is sent', () {
      final p = Parking.fromJson({
        '_id': 'p1',
        'spots': [
          {'spotNumber': 1, 'status': 'available'},
          {'spotNumber': 2, 'status': 'reserved'},
          {'spotNumber': 3, 'status': 'available'},
          {'spotNumber': 4, 'status': 'something-new'},
        ],
      });
      expect(p.availableSpots, 2);
      expect(p.totalSpots, 4);
      expect(p.spots[3].status, SpotStatus.unknown);
    });

    test('a street parking is recognised', () {
      expect(Parking.fromJson({'_id': 's', 'type': 'open_street'}).isStreet, isTrue);
    });
  });
}
