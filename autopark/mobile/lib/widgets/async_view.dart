import 'package:flutter/material.dart';

import '../design/app_theme.dart';
import '../l10n/l10n.dart';
import 'app_widgets.dart';

/// Shown when a request succeeded but there is nothing to show.
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? message;
  final Widget? action;

  const EmptyState({
    super.key,
    this.icon = Icons.inbox_outlined,
    required this.title,
    this.message,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ApSpace.s8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(color: c.surfaceAlt, shape: BoxShape.circle),
              child: Icon(icon, color: c.textMuted, size: 26),
            ),
            const AppGap(ApSpace.s4),
            Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleSmall),
            if (message != null) ...[
              const AppGap(ApSpace.s2),
              Text(message!, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
            ],
            if (action != null) ...[const AppGap(ApSpace.s5), action!],
          ],
        ),
      ),
    );
  }
}

/// Shown when a request failed. Always distinguishable from "no data", and
/// always offers a way out — three screens used to swallow failures into
/// debugPrint and render a permanently blank page.
class ErrorStateView extends StatelessWidget {
  final Object? error;
  final String? title;
  final VoidCallback? onRetry;

  const ErrorStateView({
    super.key,
    this.error,
    this.title,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final detail = error?.toString();
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ApSpace.s8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(color: c.spotOccupiedBg, shape: BoxShape.circle),
              child: Icon(Icons.wifi_off_rounded, color: c.spotOccupied, size: 26),
            ),
            const AppGap(ApSpace.s4),
            Text(
              title ?? context.l10n.commonLoadError,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleSmall,
            ),
            if (detail != null && detail.isNotEmpty) ...[
              const AppGap(ApSpace.s2),
              Text(detail, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
            ],
            if (onRetry != null) ...[
              const AppGap(ApSpace.s5),
              AppButton(
                label: context.l10n.commonRetry,
                icon: Icons.refresh_rounded,
                variant: AppButtonVariant.secondary,
                onPressed: onRetry,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Wraps any data-driven area so loading, error and empty cannot be skipped.
///
/// ```dart
/// AsyncView(
///   loading: _loading,
///   error: _error,
///   isEmpty: _items.isEmpty,
///   onRetry: _load,
///   emptyTitle: context.l10n.resEmpty,
///   builder: (_) => ListView(...),
/// )
/// ```
class AsyncView extends StatelessWidget {
  final bool loading;
  final Object? error;
  final bool isEmpty;
  final WidgetBuilder builder;
  final VoidCallback? onRetry;

  final Widget? loadingWidget;
  final String? emptyTitle;
  final String? emptyMessage;
  final IconData emptyIcon;
  final Widget? emptyAction;
  final String? errorTitle;

  const AsyncView({
    super.key,
    required this.loading,
    required this.builder,
    this.error,
    this.isEmpty = false,
    this.onRetry,
    this.loadingWidget,
    this.emptyTitle,
    this.emptyMessage,
    this.emptyIcon = Icons.inbox_outlined,
    this.emptyAction,
    this.errorTitle,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) return loadingWidget ?? const SkeletonList();
    if (error != null) return ErrorStateView(error: error, title: errorTitle, onRetry: onRetry);
    if (isEmpty) {
      return EmptyState(
        icon: emptyIcon,
        title: emptyTitle ?? context.l10n.commonNoData,
        message: emptyMessage,
        action: emptyAction,
      );
    }
    return builder(context);
  }
}
