import 'json.dart';

enum PaymentStatus { pending, paid, failed, refunded, cancelled, unknown }

PaymentStatus paymentStatusFrom(String raw) => switch (raw) {
      'pending' => PaymentStatus.pending,
      'paid' => PaymentStatus.paid,
      'failed' => PaymentStatus.failed,
      'refunded' => PaymentStatus.refunded,
      'cancelled' => PaymentStatus.cancelled,
      _ => PaymentStatus.unknown,
    };

enum PaymentMethod { wallet, card, cash }

PaymentMethod paymentMethodFrom(String raw) => switch (raw) {
      'card' => PaymentMethod.card,
      'cash' => PaymentMethod.cash,
      _ => PaymentMethod.wallet,
    };

extension PaymentMethodX on PaymentMethod {
  String get wire => switch (this) {
        PaymentMethod.wallet => 'wallet',
        PaymentMethod.card => 'card',
        PaymentMethod.cash => 'cash',
      };
}

/// One money movement, as the API reports it.
class Payment {
  final String id;
  final String? bookingId;
  final String? parkingName;
  final String kind; // booking | topup | refund
  final double amount;
  final PaymentMethod method;
  final PaymentStatus status;
  final DateTime? paidAt;
  final DateTime? createdAt;
  final String failureReason;

  const Payment({
    required this.id,
    required this.kind,
    required this.amount,
    required this.method,
    required this.status,
    this.bookingId,
    this.parkingName,
    this.paidAt,
    this.createdAt,
    this.failureReason = '',
  });

  bool get isCredit => kind == 'topup' || kind == 'refund';

  factory Payment.fromJson(Map<String, dynamic> json) => Payment(
        id: asString(json['_id']),
        bookingId: json['bookingId'] == null ? null : refId(json['bookingId']),
        parkingName: refField(json['parkingId'], 'name'),
        kind: asString(json['kind'], 'booking'),
        amount: asDouble(json['amount']),
        method: paymentMethodFrom(asString(json['method'], 'wallet')),
        status: paymentStatusFrom(asString(json['status'])),
        paidAt: asDate(json['paidAt']),
        createdAt: asDate(json['createdAt']),
        failureReason: asString(json['failureReason']),
      );
}

/// Balance plus the most recent movements, as returned by /payments/wallet.
class Wallet {
  final double balance;
  final String currency;
  final List<Payment> payments;

  const Wallet({required this.balance, this.currency = 'MAD', this.payments = const []});

  factory Wallet.fromJson(Map<String, dynamic> json) => Wallet(
        balance: asDouble(json['balance']),
        currency: asString(json['currency'], 'MAD'),
        payments: asMapList(json['payments']).map(Payment.fromJson).toList(),
      );
}
