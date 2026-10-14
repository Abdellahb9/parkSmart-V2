// GENERATED FILE — do not edit by hand.
// Source: design/tokens/*.json   Regenerate: node design/build-tokens.mjs

import 'dart:ui' show Color, FontWeight;

/// Every semantic and domain colour, for one theme.
class ApColors {
  final Color primary;
  final Color primaryHover;
  final Color primarySoft;
  final Color onPrimary;
  final Color accent;
  final Color accentSoft;
  final Color onAccent;
  final Color bg;
  final Color surface;
  final Color surfaceAlt;
  final Color border;
  final Color borderStrong;
  final Color text;
  final Color textMuted;
  final Color textInverse;
  final Color success;
  final Color warning;
  final Color danger;
  final Color dangerHover;
  final Color focus;
  final Color parkingNormal;
  final Color parkingStreet;
  final Color spotFree;
  final Color spotFreeBg;
  final Color spotReserved;
  final Color spotReservedBg;
  final Color spotOccupied;
  final Color spotOccupiedBg;
  final Color spotOverstay;
  final Color spotOverstayBg;
  final Color spotBlocked;
  final Color spotBlockedBg;

  const ApColors({
    required this.primary,
    required this.primaryHover,
    required this.primarySoft,
    required this.onPrimary,
    required this.accent,
    required this.accentSoft,
    required this.onAccent,
    required this.bg,
    required this.surface,
    required this.surfaceAlt,
    required this.border,
    required this.borderStrong,
    required this.text,
    required this.textMuted,
    required this.textInverse,
    required this.success,
    required this.warning,
    required this.danger,
    required this.dangerHover,
    required this.focus,
    required this.parkingNormal,
    required this.parkingStreet,
    required this.spotFree,
    required this.spotFreeBg,
    required this.spotReserved,
    required this.spotReservedBg,
    required this.spotOccupied,
    required this.spotOccupiedBg,
    required this.spotOverstay,
    required this.spotOverstayBg,
    required this.spotBlocked,
    required this.spotBlockedBg,
  });
}

const ApColors apLight = ApColors(
  primary: Color(0xFF0F2A4A),
  primaryHover: Color(0xFF0A1C33),
  primarySoft: Color(0xFFF2F6FB),
  onPrimary: Color(0xFFFFFFFF),
  accent: Color(0xFFC8961E),
  accentSoft: Color(0xFFFDF8EC),
  onAccent: Color(0xFF0F172A),
  bg: Color(0xFFF8FAFC),
  surface: Color(0xFFFFFFFF),
  surfaceAlt: Color(0xFFF1F5F9),
  border: Color(0xFFE2E8F0),
  borderStrong: Color(0xFFCBD5E1),
  text: Color(0xFF0F172A),
  textMuted: Color(0xFF64748B),
  textInverse: Color(0xFFFFFFFF),
  success: Color(0xFF059669),
  warning: Color(0xFFD97706),
  danger: Color(0xFFDC2626),
  dangerHover: Color(0xFFB91C1C),
  focus: Color(0xFF6B93C2),
  parkingNormal: Color(0xFF4571A6),
  parkingStreet: Color(0xFFC8961E),
  spotFree: Color(0xFF047857),
  spotFreeBg: Color(0xFFECFDF5),
  spotReserved: Color(0xFFB45309),
  spotReservedBg: Color(0xFFFFFBEB),
  spotOccupied: Color(0xFFB91C1C),
  spotOccupiedBg: Color(0xFFFEF2F2),
  spotOverstay: Color(0xFF991B1B),
  spotOverstayBg: Color(0xFFFEE2E2),
  spotBlocked: Color(0xFF475569),
  spotBlockedBg: Color(0xFFF1F5F9),
);

const ApColors apDark = ApColors(
  primary: Color(0xFF2B5586),
  primaryHover: Color(0xFF4571A6),
  primarySoft: Color(0xFF0A1C33),
  onPrimary: Color(0xFFFFFFFF),
  accent: Color(0xFFE3AC33),
  accentSoft: Color(0xFF583C17),
  onAccent: Color(0xFF0F172A),
  bg: Color(0xFF080F1C),
  surface: Color(0xFF0F172A),
  surfaceAlt: Color(0xFF1E293B),
  border: Color(0xFF334155),
  borderStrong: Color(0xFF475569),
  text: Color(0xFFF8FAFC),
  textMuted: Color(0xFF94A3B8),
  textInverse: Color(0xFF0F172A),
  success: Color(0xFF6EE7B7),
  warning: Color(0xFFFCD34D),
  danger: Color(0xFFFCA5A5),
  dangerHover: Color(0xFFFECACA),
  focus: Color(0xFF98B7DA),
  parkingNormal: Color(0xFF98B7DA),
  parkingStreet: Color(0xFFE3AC33),
  spotFree: Color(0xFF6EE7B7),
  spotFreeBg: Color(0xFF06301F),
  spotReserved: Color(0xFFFCD34D),
  spotReservedBg: Color(0xFF3A2A06),
  spotOccupied: Color(0xFFFCA5A5),
  spotOccupiedBg: Color(0xFF3A1212),
  spotOverstay: Color(0xFFFECACA),
  spotOverstayBg: Color(0xFF4A1414),
  spotBlocked: Color(0xFFCBD5E1),
  spotBlockedBg: Color(0xFF1E293B),
);

/// Spacing scale (4px base).
class ApSpace {
  const ApSpace._();
  static const double s0 = 0.0;
  static const double s1 = 4.0;
  static const double s2 = 8.0;
  static const double s3 = 12.0;
  static const double s4 = 16.0;
  static const double s5 = 20.0;
  static const double s6 = 24.0;
  static const double s8 = 32.0;
  static const double s10 = 40.0;
  static const double s12 = 48.0;
  static const double s16 = 64.0;
}

/// Corner radii.
class ApRadius {
  const ApRadius._();
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double full = 9999.0;
}

/// Font sizes, in logical pixels.
class ApText {
  const ApText._();
  static const double xs = 12.0;
  static const double sm = 14.0;
  static const double base = 16.0;
  static const double lg = 18.0;
  static const double xl = 20.0;
  static const double xl2 = 24.0;
  static const double xl3 = 30.0;
  static const double xl4 = 36.0;
}

/// Font weights.
class ApWeight {
  const ApWeight._();
  static const FontWeight regular = FontWeight.w400;
  static const FontWeight medium = FontWeight.w500;
  static const FontWeight semibold = FontWeight.w600;
  static const FontWeight bold = FontWeight.w700;
}

/// Line heights, as multipliers.
class ApLeading {
  const ApLeading._();
  static const double tight = 1.20;
  static const double snug = 1.35;
  static const double normal = 1.55;
  static const double relaxed = 1.70;
}
