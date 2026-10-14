import 'json.dart';

class AppUser {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final String? cne;
  final String role;

  const AppUser({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.phone,
    this.cne,
  });

  bool get isTechnician => role == 'technicien';
  bool get isDriver => role == 'user';

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: asString(json['_id']),
        fullName: asString(json['fullName']),
        email: asString(json['email']),
        phone: asStringOrNull(json['phone']),
        cne: asStringOrNull(json['CNE']),
        role: asString(json['role']),
      );

  Map<String, dynamic> toJson() => {
        '_id': id,
        'fullName': fullName,
        'email': email,
        'phone': phone,
        'CNE': cne,
        'role': role,
      };
}

class Complaint {
  final String id;
  final String? parkingName;
  final String message;
  final String status;
  final DateTime? createdAt;

  const Complaint({
    required this.id,
    required this.message,
    required this.status,
    this.parkingName,
    this.createdAt,
  });

  bool get isResolved => status == 'resolved';

  factory Complaint.fromJson(Map<String, dynamic> json) => Complaint(
        id: asString(json['_id']),
        parkingName: refField(json['parkingId'], 'name'),
        message: asString(json['message']),
        status: asString(json['status'], 'open'),
        createdAt: asDate(json['createdAt']),
      );
}

class LoyaltyPoint {
  final String parkingName;
  final int bookingCount;

  const LoyaltyPoint({required this.parkingName, required this.bookingCount});

  factory LoyaltyPoint.fromJson(Map<String, dynamic> json) => LoyaltyPoint(
        parkingName: refField(json['parkingId'], 'name') ?? 'Parking',
        bookingCount: asInt(json['bookingCount']),
      );
}

class Reward {
  final String id;
  final String title;
  final String description;
  final String type;
  final int requiredBookings;
  final int currentBookings;
  final bool unlocked;
  final int progress;
  final String? parkingName;

  const Reward({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.requiredBookings,
    required this.currentBookings,
    required this.unlocked,
    required this.progress,
    this.parkingName,
  });

  factory Reward.fromJson(Map<String, dynamic> json) => Reward(
        id: asString(json['_id']),
        title: asString(json['title']),
        description: asString(json['description']),
        type: asString(json['type']),
        requiredBookings: asInt(json['requiredBookings'], 1),
        currentBookings: asInt(json['currentBookings']),
        unlocked: asBool(json['unlocked']),
        progress: asInt(json['progress']).clamp(0, 100),
        parkingName: refField(json['parkingId'], 'name'),
      );
}

class RewardsBundle {
  final List<LoyaltyPoint> loyalty;
  final List<Reward> rewards;

  const RewardsBundle({required this.loyalty, required this.rewards});

  bool get isEmpty => loyalty.isEmpty && rewards.isEmpty;

  factory RewardsBundle.fromJson(Map<String, dynamic> json) => RewardsBundle(
        loyalty: asMapList(json['loyaltyPoints']).map(LoyaltyPoint.fromJson).toList(),
        rewards: asMapList(json['rewards']).map(Reward.fromJson).toList(),
      );
}

/// A public-street parking as the technician sees it.
class StreetParking {
  final String id;
  final String name;
  final String address;
  final int totalSpots;
  final int availableSpots;

  const StreetParking({
    required this.id,
    required this.name,
    required this.address,
    required this.totalSpots,
    required this.availableSpots,
  });

  double get occupancy => totalSpots == 0 ? 0 : (totalSpots - availableSpots) / totalSpots;

  factory StreetParking.fromJson(Map<String, dynamic> json) => StreetParking(
        id: asString(json['_id']),
        name: asString(json['name'], 'Voie publique'),
        address: asString(json['address']),
        totalSpots: asInt(json['totalSpots']),
        availableSpots: asInt(json['availableSpots']),
      );
}

/// A spot on a street parking, with the active booking when there is one.
class StreetSpot {
  final int spotNumber;
  final String status;
  final String? carPlate;
  final DateTime? endTime;

  const StreetSpot({required this.spotNumber, required this.status, this.carPlate, this.endTime});

  bool get isFree => status == 'available';
  bool get isOverstay => endTime != null && endTime!.isBefore(DateTime.now());

  factory StreetSpot.fromJson(Map<String, dynamic> json) {
    final booking = asMap(json['booking']);
    return StreetSpot(
      spotNumber: asInt(json['spotNumber']),
      status: asString(json['status'], 'available'),
      carPlate: asStringOrNull(booking['carPlate']),
      endTime: asDate(booking['endTime']),
    );
  }
}

class Fine {
  final String id;
  final String carPlate;
  final String reason;
  final DateTime? issuedAt;
  final String? streetName;
  final int? spotNumber;

  /// Whether photo evidence was attached. The API never says where it is
  /// stored; the image is fetched through an authenticated route.
  final bool hasPhoto;

  const Fine({
    required this.id,
    required this.carPlate,
    required this.reason,
    this.issuedAt,
    this.streetName,
    this.spotNumber,
    this.hasPhoto = false,
  });

  factory Fine.fromJson(Map<String, dynamic> json) => Fine(
        id: asString(json['_id']),
        carPlate: asString(json['carPlate']),
        reason: asString(json['reason']),
        issuedAt: asDate(json['issuedAt']),
        streetName: refField(json['streetParkingId'], 'name'),
        spotNumber: json['spotNumber'] == null ? null : asInt(json['spotNumber']),
        hasPhoto: asBool(json['hasPhoto']),
      );
}
