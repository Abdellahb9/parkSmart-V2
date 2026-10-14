import 'package:geolocator/geolocator.dart';

import '../l10n/l10n.dart';

class LocationFailure implements Exception {
  final String message;
  LocationFailure(this.message);
  @override
  String toString() => message;
}

/// "Locate me" support.
///
/// The manifest has always requested location permission; until now nothing
/// in the app used it, which is both a Play Store review problem and a
/// missing feature on a parking map.
class LocationService {
  const LocationService._();

  static Future<Position> current() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw LocationFailure(L10n.current.locationDisabled);
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied) {
      throw LocationFailure(L10n.current.locationDenied);
    }
    if (permission == LocationPermission.deniedForever) {
      throw LocationFailure(L10n.current.locationBlocked);
    }

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, timeLimit: Duration(seconds: 12)),
    );
  }
}
