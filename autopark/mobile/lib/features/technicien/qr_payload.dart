/// Reads the entry code out of whatever a camera decoded.
///
/// The driver's app encodes `autopark://checkin?b=<bookingId>&t=<token>`.
/// Only the token is needed — the server looks the booking up by it — but the
/// booking id is kept for display and logging.
///
/// A bare token (someone typing the code under the QR, or an older QR that
/// carried the token alone) is accepted too. Anything else — a URL, a Wi-Fi
/// QR, a product barcode — returns null, so the screen can say "this is not
/// an AutoPark code" instead of sending garbage to the API.
class CheckinPayload {
  final String token;
  final String? bookingId;

  const CheckinPayload(this.token, {this.bookingId});

  // base64url, as the server generates it: 18 random bytes → 24 characters.
  static final _bareToken = RegExp(r'^[A-Za-z0-9_-]{16,64}$');

  static CheckinPayload? parse(String? raw) {
    final text = raw?.trim() ?? '';
    if (text.isEmpty) return null;

    final uri = Uri.tryParse(text);
    if (uri != null && uri.scheme == 'autopark') {
      if (uri.host != 'checkin') return null;
      final token = uri.queryParameters['t']?.trim() ?? '';
      if (!_bareToken.hasMatch(token)) return null;
      final booking = uri.queryParameters['b']?.trim();
      return CheckinPayload(token, bookingId: (booking == null || booking.isEmpty) ? null : booking);
    }

    if (_bareToken.hasMatch(text)) return CheckinPayload(text);
    return null;
  }
}
