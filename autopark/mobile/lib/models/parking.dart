import 'json.dart';

enum ParkingType { normal, street }

enum SpotStatus { available, reserved, occupied, unknown }

SpotStatus spotStatusFrom(String raw) => switch (raw) {
      'available' => SpotStatus.available,
      'reserved' => SpotStatus.reserved,
      'occupied' => SpotStatus.occupied,
      _ => SpotStatus.unknown,
    };

class Spot {
  final int spotNumber;
  final SpotStatus status;

  const Spot({required this.spotNumber, required this.status});

  bool get isFree => status == SpotStatus.available;

  factory Spot.fromJson(Map<String, dynamic> json) => Spot(
        spotNumber: asInt(json['spotNumber']),
        status: spotStatusFrom(asString(json['status'])),
      );
}

class Parking {
  final String id;
  final String name;
  final ParkingType type;
  final String address;
  final double latitude;
  final double longitude;
  final int totalSpots;
  final int availableSpots;
  final double pricePerHour;
  final double pricePerDay;
  final String? ownerName;
  final List<Spot> spots;

  const Parking({
    required this.id,
    required this.name,
    required this.type,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.totalSpots,
    required this.availableSpots,
    required this.pricePerHour,
    required this.pricePerDay,
    this.ownerName,
    this.spots = const [],
  });

  bool get isStreet => type == ParkingType.street;
  bool get hasFreeSpots => availableSpots > 0;
  double get occupancy => totalSpots == 0 ? 0 : (totalSpots - availableSpots) / totalSpots;

  /// True only when the API actually gave usable coordinates — one malformed
  /// row used to wipe every marker off the map.
  bool get hasPosition => latitude != 0 || longitude != 0;

  factory Parking.fromJson(Map<String, dynamic> json) {
    final location = asMap(json['location']);
    final coords = location['coordinates'];
    // GeoJSON order is [longitude, latitude].
    double lng = 0;
    double lat = 0;
    if (coords is List && coords.length >= 2) {
      lng = asDouble(coords[0]);
      lat = asDouble(coords[1]);
    }

    final spots = asMapList(json['spots']).map(Spot.fromJson).toList();
    final total = asInt(json['totalSpots'], spots.length);

    return Parking(
      id: asString(json['_id']),
      name: asString(json['name'], 'Parking'),
      type: asString(json['type']) == 'open_street' ? ParkingType.street : ParkingType.normal,
      address: asString(json['address']),
      latitude: lat,
      longitude: lng,
      totalSpots: total,
      availableSpots: json['availableSpots'] != null
          ? asInt(json['availableSpots'])
          : spots.where((s) => s.isFree).length,
      pricePerHour: asDouble(json['pricePerHour']),
      pricePerDay: asDouble(json['pricePerDay']),
      ownerName: refField(json['ownerId'], 'fullName'),
      spots: spots,
    );
  }
}
