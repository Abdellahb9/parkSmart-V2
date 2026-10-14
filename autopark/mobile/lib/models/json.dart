/// Defensive JSON readers.
///
/// Screens used to index `Map<String, dynamic>` straight off `jsonDecode`, so
/// one missing or renamed field was a red screen in `build`. Everything comes
/// through these helpers instead, which never throw and never surface the
/// literal text "null" to a user.
library;

String asString(dynamic v, [String fallback = '']) {
  if (v is String) return v == 'null' ? fallback : v;
  if (v == null) return fallback;
  return v.toString();
}

/// Null when the value is absent, empty, or the string "null".
String? asStringOrNull(dynamic v) {
  final s = asString(v);
  return s.isEmpty ? null : s;
}

int asInt(dynamic v, [int fallback = 0]) {
  if (v is int) return v;
  if (v is num) return v.toInt();
  return int.tryParse(asString(v)) ?? fallback;
}

double asDouble(dynamic v, [double fallback = 0]) {
  if (v is double) return v;
  if (v is num) return v.toDouble();
  return double.tryParse(asString(v)) ?? fallback;
}

bool asBool(dynamic v, [bool fallback = false]) {
  if (v is bool) return v;
  if (v is num) return v != 0;
  final s = asString(v).toLowerCase();
  if (s == 'true') return true;
  if (s == 'false') return false;
  return fallback;
}

DateTime? asDate(dynamic v) {
  if (v is DateTime) return v;
  final s = asStringOrNull(v);
  return s == null ? null : DateTime.tryParse(s)?.toLocal();
}

Map<String, dynamic> asMap(dynamic v) =>
    v is Map ? v.map((key, value) => MapEntry(key.toString(), value)) : <String, dynamic>{};

List<Map<String, dynamic>> asMapList(dynamic v) =>
    v is List ? v.whereType<Map>().map(asMap).toList() : <Map<String, dynamic>>[];

/// Mongo references arrive either as an id string or as a populated document.
String refId(dynamic v) => v is Map ? asString(asMap(v)['_id']) : asString(v);

/// Reads a field from a populated reference, or null when it was not populated.
String? refField(dynamic v, String field) => v is Map ? asStringOrNull(asMap(v)[field]) : null;
