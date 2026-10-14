import 'package:flutter/material.dart';

import 'app_tokens.g.dart';

export 'app_tokens.g.dart';

/// Carries the generated palette through the widget tree.
///
/// Widgets read `context.colors.spotFree` instead of hardcoding a hex, so a
/// change in `design/tokens/` moves the app with one regeneration.
@immutable
class ApTheme extends ThemeExtension<ApTheme> {
  final ApColors colors;
  const ApTheme({required this.colors});

  @override
  ApTheme copyWith({ApColors? colors}) => ApTheme(colors: colors ?? this.colors);

  @override
  ApTheme lerp(ThemeExtension<ApTheme>? other, double t) =>
      (other is ApTheme && t >= 0.5) ? other : this;
}

extension ApThemeContext on BuildContext {
  /// The AutoPark palette for the active theme.
  ApColors get colors => Theme.of(this).extension<ApTheme>()?.colors ?? apLight;
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
}

/// Shadows, which stay hand-written because CSS shadow strings do not map
/// cleanly onto BoxShadow.
class ApElevation {
  const ApElevation._();

  static List<BoxShadow> level1(ApColors c) => [
        BoxShadow(color: c.text.withValues(alpha: 0.06), blurRadius: 3, offset: const Offset(0, 1)),
      ];

  static List<BoxShadow> level2(ApColors c) => [
        BoxShadow(color: c.text.withValues(alpha: 0.08), blurRadius: 12, offset: const Offset(0, 4)),
      ];

  static List<BoxShadow> level3(ApColors c) => [
        BoxShadow(color: c.text.withValues(alpha: 0.12), blurRadius: 24, offset: const Offset(0, 8)),
      ];
}

ThemeData _build(ApColors c, Brightness brightness) {
  final scheme = ColorScheme(
    brightness: brightness,
    primary: c.primary,
    onPrimary: c.onPrimary,
    secondary: c.accent,
    onSecondary: c.onAccent,
    error: c.danger,
    onError: c.onPrimary,
    surface: c.surface,
    onSurface: c.text,
    surfaceContainerHighest: c.surfaceAlt,
    outline: c.border,
    outlineVariant: c.borderStrong,
  );

  final text = TextTheme(
    displaySmall: TextStyle(fontSize: ApText.xl4, fontWeight: ApWeight.bold, color: c.text, height: ApLeading.tight),
    headlineMedium: TextStyle(fontSize: ApText.xl3, fontWeight: ApWeight.bold, color: c.text, height: ApLeading.tight),
    headlineSmall: TextStyle(fontSize: ApText.xl2, fontWeight: ApWeight.bold, color: c.text, height: ApLeading.tight),
    titleLarge: TextStyle(fontSize: ApText.xl, fontWeight: ApWeight.semibold, color: c.text, height: ApLeading.snug),
    titleMedium: TextStyle(fontSize: ApText.lg, fontWeight: ApWeight.semibold, color: c.text, height: ApLeading.snug),
    titleSmall: TextStyle(fontSize: ApText.base, fontWeight: ApWeight.semibold, color: c.text, height: ApLeading.snug),
    bodyLarge: TextStyle(fontSize: ApText.base, color: c.text, height: ApLeading.normal),
    bodyMedium: TextStyle(fontSize: ApText.sm, color: c.text, height: ApLeading.normal),
    bodySmall: TextStyle(fontSize: ApText.xs, color: c.textMuted, height: ApLeading.normal),
    labelLarge: TextStyle(fontSize: ApText.sm, fontWeight: ApWeight.semibold, color: c.text),
    labelMedium: TextStyle(fontSize: ApText.xs, fontWeight: ApWeight.semibold, color: c.textMuted),
  );

  final radiusMd = BorderRadius.circular(ApRadius.md);

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.bg,
    canvasColor: c.surface,
    dividerColor: c.border,
    textTheme: text,
    extensions: [ApTheme(colors: c)],
    appBarTheme: AppBarTheme(
      backgroundColor: c.surface,
      foregroundColor: c.text,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: text.titleMedium,
    ),
    cardTheme: CardThemeData(
      color: c.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(ApRadius.lg),
        side: BorderSide(color: c.border),
      ),
    ),
    dividerTheme: DividerThemeData(color: c.border, thickness: 1, space: 1),
    iconTheme: IconThemeData(color: c.textMuted),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: c.surface,
      hintStyle: TextStyle(color: c.textMuted, fontSize: ApText.sm),
      labelStyle: TextStyle(color: c.textMuted, fontSize: ApText.sm),
      contentPadding: const EdgeInsets.symmetric(horizontal: ApSpace.s4, vertical: ApSpace.s3),
      border: OutlineInputBorder(borderRadius: radiusMd, borderSide: BorderSide(color: c.border)),
      enabledBorder: OutlineInputBorder(borderRadius: radiusMd, borderSide: BorderSide(color: c.border)),
      focusedBorder: OutlineInputBorder(borderRadius: radiusMd, borderSide: BorderSide(color: c.focus, width: 2)),
      errorBorder: OutlineInputBorder(borderRadius: radiusMd, borderSide: BorderSide(color: c.danger)),
      focusedErrorBorder: OutlineInputBorder(borderRadius: radiusMd, borderSide: BorderSide(color: c.danger, width: 2)),
      errorStyle: TextStyle(color: c.danger, fontSize: ApText.xs),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: c.primary,
        foregroundColor: c.onPrimary,
        disabledBackgroundColor: c.borderStrong,
        disabledForegroundColor: c.textMuted,
        elevation: 0,
        minimumSize: const Size(0, ApSpace.s12), // 48dp: the accessible touch target
        padding: const EdgeInsets.symmetric(horizontal: ApSpace.s5),
        shape: RoundedRectangleBorder(borderRadius: radiusMd),
        textStyle: const TextStyle(fontSize: ApText.sm, fontWeight: ApWeight.semibold),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: c.text,
        minimumSize: const Size(0, ApSpace.s12),
        padding: const EdgeInsets.symmetric(horizontal: ApSpace.s5),
        side: BorderSide(color: c.border),
        shape: RoundedRectangleBorder(borderRadius: radiusMd),
        textStyle: const TextStyle(fontSize: ApText.sm, fontWeight: ApWeight.semibold),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: c.primary,
        minimumSize: const Size(0, ApSpace.s12),
        textStyle: const TextStyle(fontSize: ApText.sm, fontWeight: ApWeight.semibold),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: c.surface,
      indicatorColor: c.primarySoft,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(fontSize: ApText.xs, fontWeight: ApWeight.medium, color: c.textMuted),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(color: states.contains(WidgetState.selected) ? c.primary : c.textMuted),
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: c.surface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ApRadius.lg)),
      titleTextStyle: text.titleMedium,
      contentTextStyle: text.bodyMedium,
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: c.surface,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(ApRadius.xl)),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: c.text,
      contentTextStyle: TextStyle(color: c.textInverse, fontSize: ApText.sm),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: radiusMd),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: c.surfaceAlt,
      selectedColor: c.primarySoft,
      labelStyle: TextStyle(fontSize: ApText.xs, fontWeight: ApWeight.semibold, color: c.text),
      side: BorderSide(color: c.border),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ApRadius.full)),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(
      color: c.primary,
      linearTrackColor: c.surfaceAlt,
      circularTrackColor: c.surfaceAlt,
    ),
  );
}

class AppTheme {
  const AppTheme._();
  static ThemeData get light => _build(apLight, Brightness.light);
  static ThemeData get dark => _build(apDark, Brightness.dark);
}
