import 'package:autopark_mobile/features/technicien/qr_payload.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('CheckinPayload.parse', () {
    test('reads the token and booking from the app QR', () {
      final p = CheckinPayload.parse('autopark://checkin?b=6ace482c11771e24f81e6fcb&t=uVSdac8jEahIcjVwmIwiRtRJ');
      expect(p, isNotNull);
      expect(p!.token, 'uVSdac8jEahIcjVwmIwiRtRJ');
      expect(p.bookingId, '6ace482c11771e24f81e6fcb');
    });

    test('accepts a bare token typed from the driver screen', () {
      final p = CheckinPayload.parse('  uVSdac8jEahIcjVwmIwiRtRJ  ');
      expect(p?.token, 'uVSdac8jEahIcjVwmIwiRtRJ');
      expect(p?.bookingId, isNull);
    });

    test('keeps base64url characters', () {
      expect(CheckinPayload.parse('autopark://checkin?t=Ab-_9zXy8wVu7tSr6qPo')?.token, 'Ab-_9zXy8wVu7tSr6qPo');
    });

    test('rejects other autopark links', () {
      expect(CheckinPayload.parse('autopark://pay?t=uVSdac8jEahIcjVwmIwiRtRJ'), isNull);
    });

    test('rejects a checkin link without a usable token', () {
      expect(CheckinPayload.parse('autopark://checkin?b=123'), isNull);
      expect(CheckinPayload.parse('autopark://checkin?t=short'), isNull);
      expect(CheckinPayload.parse('autopark://checkin?t=has spaces in it ok'), isNull);
    });

    test('rejects QR codes that are not AutoPark codes', () {
      expect(CheckinPayload.parse('https://example.com/?t=uVSdac8jEahIcjVwmIwiRtRJ'), isNull);
      expect(CheckinPayload.parse('WIFI:T:WPA;S:Cafe;P:secret;;'), isNull);
      expect(CheckinPayload.parse('6111234567890'), isNull);
      expect(CheckinPayload.parse(''), isNull);
      expect(CheckinPayload.parse(null), isNull);
    });
  });
}
