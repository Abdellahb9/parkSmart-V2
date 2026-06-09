import 'package:flutter/material.dart';

class AppColors {
  static const primary = Color(0xFF3A6BC4);
  static const primaryLight = Color(0xFF5A8BE4);
  static const primaryDark = Color(0xFF2A4F94);
  static const accent = Color(0xFFFFC107);
  static const accentDark = Color(0xFFFFA000);
  static const bgMain = Color(0xFFF0F4F8);
  static const bgCard = Colors.white;
  static const textPrimary = Color(0xFF1E293B);
  static const textSecondary = Color(0xFF64748B);
  static const success = Color(0xFF10B981);
  static const danger = Color(0xFFEF4444);
  static const warning = Color(0xFFF59E0B);
  static const border = Color(0xFFE2E8F0);
}

class ApiConfig {
  // Change this to your backend URL
  // For Android emulator use 10.0.2.2, for iOS simulator use localhost
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  // Laayoune coordinates
  static const double defaultLat = 27.1536;
  static const double defaultLng = -13.2033;
  static const double defaultZoom = 14.0;
}
