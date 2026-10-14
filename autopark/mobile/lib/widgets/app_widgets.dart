import 'package:flutter/material.dart';

import '../design/app_theme.dart';

/// Spacing that comes from the token scale instead of an ad-hoc SizedBox.
/// The audit counted 83 one-off gaps across 12 different values.
class AppGap extends StatelessWidget {
  final double size;
  final Axis axis;

  const AppGap(this.size, {super.key, this.axis = Axis.vertical});

  const AppGap.xs({super.key, this.axis = Axis.vertical}) : size = ApSpace.s2;
  const AppGap.sm({super.key, this.axis = Axis.vertical}) : size = ApSpace.s3;
  const AppGap.md({super.key, this.axis = Axis.vertical}) : size = ApSpace.s4;
  const AppGap.lg({super.key, this.axis = Axis.vertical}) : size = ApSpace.s6;
  const AppGap.xl({super.key, this.axis = Axis.vertical}) : size = ApSpace.s8;

  @override
  Widget build(BuildContext context) =>
      axis == Axis.vertical ? SizedBox(height: size) : SizedBox(width: size);
}

/// The surface every panel in the app sits on: one radius, one border, one
/// shadow — replacing twelve inline white containers with four radii.
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final Color? background;
  final bool elevated;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.background,
    this.elevated = false,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final radius = BorderRadius.circular(ApRadius.lg);

    final content = Container(
      padding: padding ?? const EdgeInsets.all(ApSpace.s4),
      decoration: BoxDecoration(
        color: background ?? c.surface,
        borderRadius: radius,
        border: Border.all(color: c.border),
        boxShadow: elevated ? ApElevation.level2(c) : null,
      ),
      child: child,
    );

    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      child: InkWell(borderRadius: radius, onTap: onTap, child: content),
    );
  }
}

enum AppButtonVariant { primary, secondary, ghost, danger, accent }

/// One button, five variants, with a loading state and a 48dp minimum height.
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final AppButtonVariant variant;
  final bool loading;
  final bool expand;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.variant = AppButtonVariant.primary,
    this.loading = false,
    this.expand = false,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final disabled = loading || onPressed == null;

    final (Color bg, Color fg, Color? border) = switch (variant) {
      AppButtonVariant.primary => (c.primary, c.onPrimary, null),
      AppButtonVariant.secondary => (c.surface, c.text, c.border),
      AppButtonVariant.ghost => (Colors.transparent, c.text, null),
      AppButtonVariant.danger => (c.danger, c.onPrimary, null),
      AppButtonVariant.accent => (c.accent, c.onAccent, null),
    };

    final child = Row(
      mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (loading)
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2, color: fg),
          )
        else if (icon != null)
          Icon(icon, size: 18, color: fg),
        if (loading || icon != null) const AppGap(ApSpace.s2, axis: Axis.horizontal),
        Flexible(
          child: Text(
            label,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: ApText.sm, fontWeight: ApWeight.semibold, color: fg),
          ),
        ),
      ],
    );

    return SizedBox(
      width: expand ? double.infinity : null,
      child: ElevatedButton(
        onPressed: disabled ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          disabledBackgroundColor: variant == AppButtonVariant.ghost ? Colors.transparent : c.borderStrong,
          disabledForegroundColor: c.textMuted,
          elevation: 0,
          minimumSize: const Size(0, ApSpace.s12),
          padding: const EdgeInsets.symmetric(horizontal: ApSpace.s5),
          side: border == null ? null : BorderSide(color: border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ApRadius.md)),
        ),
        child: child,
      ),
    );
  }
}

/// Spot and parking states, named once.
enum AppTone { free, reserved, occupied, overstay, blocked, normal, street, neutral }

class StatusBadge extends StatelessWidget {
  final String label;
  final AppTone tone;
  final IconData? icon;
  final bool dot;

  const StatusBadge({super.key, required this.label, this.tone = AppTone.neutral, this.icon, this.dot = false});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final (Color fg, Color bg) = switch (tone) {
      AppTone.free => (c.spotFree, c.spotFreeBg),
      AppTone.reserved => (c.spotReserved, c.spotReservedBg),
      AppTone.occupied => (c.spotOccupied, c.spotOccupiedBg),
      AppTone.overstay => (c.spotOverstay, c.spotOverstayBg),
      AppTone.blocked => (c.spotBlocked, c.spotBlockedBg),
      AppTone.normal => (c.parkingNormal, c.primarySoft),
      AppTone.street => (c.parkingStreet, c.accentSoft),
      AppTone.neutral => (c.textMuted, c.surfaceAlt),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: ApSpace.s3, vertical: ApSpace.s1 + 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(ApRadius.full)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Decorative only — the label always carries the meaning, so status
          // is never conveyed by colour alone.
          if (dot) ...[
            Container(width: 6, height: 6, decoration: BoxDecoration(color: fg, shape: BoxShape.circle)),
            const AppGap(ApSpace.s2, axis: Axis.horizontal),
          ] else if (icon != null) ...[
            Icon(icon, size: 14, color: fg),
            const AppGap(ApSpace.s1, axis: Axis.horizontal),
          ],
          Text(label, style: TextStyle(color: fg, fontSize: ApText.xs, fontWeight: ApWeight.semibold)),
        ],
      ),
    );
  }
}

/// Pulsing placeholder used while data loads, so a slow screen shows shape
/// rather than a blank page or a bare spinner.
class SkeletonBox extends StatefulWidget {
  final double? width;
  final double height;
  final double? radius;

  const SkeletonBox({super.key, this.width, this.height = 16, this.radius});

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    // Respect the OS "reduce motion" setting.
    final animate = !MediaQuery.disableAnimationsOf(context);
    return FadeTransition(
      opacity: animate
          ? Tween(begin: 0.45, end: 1.0).animate(_controller)
          : const AlwaysStoppedAnimation(0.7),
      child: Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: c.surfaceAlt,
          borderRadius: BorderRadius.circular(widget.radius ?? ApRadius.sm),
        ),
      ),
    );
  }
}

class SkeletonList extends StatelessWidget {
  final int count;
  final double itemHeight;

  const SkeletonList({super.key, this.count = 4, this.itemHeight = 72});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(ApSpace.s4),
      itemCount: count,
      separatorBuilder: (_, __) => const AppGap(ApSpace.s3),
      itemBuilder: (_, __) => SkeletonBox(height: itemHeight, radius: ApRadius.lg),
    );
  }
}
