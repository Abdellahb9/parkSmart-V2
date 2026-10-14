import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/api_service.dart';
import '../../design/app_theme.dart';
import '../../l10n/l10n.dart';
import '../../repositories/repositories.dart';
import '../../widgets/widgets.dart';
import 'qr_payload.dart';

/// Outcome of one validation attempt, shown over the camera until the
/// technician moves on to the next car.
class _Outcome {
  final bool ok;
  final String title;
  final String detail;
  const _Outcome({required this.ok, required this.title, required this.detail});
}

/// Scan a driver's entry QR and validate their arrival.
///
/// One scan → one request: detection is ignored while a request is in flight
/// or a result is on screen, so a QR held in front of the camera is never
/// submitted twice. The typed code is a full alternative for when the camera
/// is refused, broken, or the driver's screen is cracked.
class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> with WidgetsBindingObserver {
  final _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    formats: const [BarcodeFormat.qrCode],
  );

  bool _busy = false;
  _Outcome? _outcome;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller.dispose();
    super.dispose();
  }

  // The camera is released when the app goes to the background, so the
  // phone's camera is not held hostage by a screen nobody is looking at.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!_controller.value.hasCameraPermission) return;
    if (state == AppLifecycleState.resumed && _outcome == null) {
      _controller.start();
    } else if (state == AppLifecycleState.paused) {
      _controller.stop();
    }
  }

  void _onDetect(BarcodeCapture capture) {
    if (_busy || _outcome != null) return;
    final raw = capture.barcodes.map((b) => b.rawValue).whereType<String>().firstOrNull;
    if (raw == null) return;
    _validate(raw);
  }

  Future<void> _validate(String raw) async {
    final l = context.l10n;
    final payload = CheckinPayload.parse(raw);
    if (payload == null) {
      HapticFeedback.heavyImpact();
      _show(_Outcome(ok: false, title: l.scanFailed, detail: l.scanNotAutopark));
      return;
    }

    setState(() => _busy = true);
    try {
      final result = await bookingRepo.checkInByToken(payload.token);
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      final where = result.parkingName.isEmpty ? '' : '\n${result.parkingName}';
      _show(_Outcome(
        ok: true,
        title: l.scanOk,
        detail: l.scanOkDetail(isolate(result.booking.carPlate), result.booking.spotNumber) + where,
      ));
    } catch (e) {
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      // The API words its refusal in the app language (X-App-Language).
      _show(_Outcome(ok: false, title: l.scanFailed, detail: e is ApiException ? e.message : e.toString()));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _show(_Outcome outcome) {
    _controller.stop();
    setState(() => _outcome = outcome);
  }

  void _scanAgain() {
    setState(() => _outcome = null);
    _controller.start();
  }

  Future<void> _typeCode() async {
    final code = await showDialog<String>(context: context, builder: (_) => const _ManualCodeDialog());
    if (code == null || !mounted) return;
    await _validate(code);
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final c = context.colors;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(l.scanTitle),
        actions: [
          ValueListenableBuilder<MobileScannerState>(
            valueListenable: _controller,
            builder: (context, state, _) {
              if (state.torchState == TorchState.unavailable) return const SizedBox.shrink();
              return IconButton(
                tooltip: l.scanTorch,
                icon: Icon(state.torchState == TorchState.on ? Icons.flash_on_rounded : Icons.flash_off_rounded),
                onPressed: _controller.toggleTorch,
              );
            },
          ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error) => _CameraUnavailable(
              message: error.errorCode == MobileScannerErrorCode.permissionDenied
                  ? l.scanPermission
                  : l.scanCameraError,
              onTypeCode: _typeCode,
            ),
          ),
          if (_outcome == null) const _Viewfinder(),
          if (_busy)
            Container(
              color: Colors.black45,
              alignment: Alignment.center,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(color: Colors.white),
                  const AppGap(ApSpace.s3),
                  Text(l.scanChecking, style: const TextStyle(color: Colors.white)),
                ],
              ),
            ),
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(ApSpace.s4),
                child: _outcome == null
                    ? Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            l.scanHint,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.white, fontSize: ApText.sm),
                          ),
                          const AppGap(ApSpace.s3),
                          AppButton(
                            label: l.scanManual,
                            icon: Icons.keyboard_rounded,
                            variant: AppButtonVariant.secondary,
                            onPressed: _busy ? null : _typeCode,
                            expand: true,
                          ),
                        ],
                      )
                    : _OutcomeCard(outcome: _outcome!, colors: c, onNext: _scanAgain),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Square guide with a darkened surround, so the technician knows where to
/// hold the driver's phone.
class _Viewfinder extends StatelessWidget {
  const _Viewfinder();

  @override
  Widget build(BuildContext context) {
    return const IgnorePointer(child: CustomPaint(painter: _ViewfinderPainter(), size: Size.infinite));
  }
}

class _ViewfinderPainter extends CustomPainter {
  const _ViewfinderPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final side = (size.shortestSide * 0.68).clamp(180.0, 320.0);
    final hole = RRect.fromRectAndRadius(
      Rect.fromCenter(center: size.center(Offset.zero), width: side, height: side),
      const Radius.circular(ApRadius.lg),
    );
    final dimmed = Path.combine(
      PathOperation.difference,
      Path()..addRect(Offset.zero & size),
      Path()..addRRect(hole),
    );
    canvas.drawPath(dimmed, Paint()..color = Colors.black54);
    canvas.drawRRect(
      hole,
      Paint()
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _OutcomeCard extends StatelessWidget {
  final _Outcome outcome;
  final ApColors colors;
  final VoidCallback onNext;

  const _OutcomeCard({required this.outcome, required this.colors, required this.onNext});

  @override
  Widget build(BuildContext context) {
    final tone = outcome.ok ? colors.spotFree : colors.danger;
    final bg = outcome.ok ? colors.spotFreeBg : colors.spotOccupiedBg;

    return AppCard(
      elevated: true,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
            child: Icon(outcome.ok ? Icons.check_rounded : Icons.close_rounded, color: tone, size: 32),
          ),
          const AppGap(ApSpace.s3),
          Text(outcome.title, style: Theme.of(context).textTheme.titleMedium?.copyWith(color: tone)),
          const AppGap(ApSpace.s2),
          Text(outcome.detail, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
          const AppGap(ApSpace.s4),
          AppButton(
            label: context.l10n.scanAgain,
            icon: Icons.qr_code_scanner_rounded,
            onPressed: onNext,
            expand: true,
          ),
        ],
      ),
    );
  }
}

class _CameraUnavailable extends StatelessWidget {
  final String message;
  final VoidCallback onTypeCode;

  const _CameraUnavailable({required this.message, required this.onTypeCode});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: context.colors.bg,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(ApSpace.s6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.no_photography_outlined, size: 48, color: context.colors.textMuted),
              const AppGap(ApSpace.s4),
              Text(message, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
              const AppGap(ApSpace.s5),
              AppButton(label: context.l10n.scanManual, icon: Icons.keyboard_rounded, onPressed: onTypeCode),
            ],
          ),
        ),
      ),
    );
  }
}

class _ManualCodeDialog extends StatefulWidget {
  const _ManualCodeDialog();

  @override
  State<_ManualCodeDialog> createState() => _ManualCodeDialogState();
}

class _ManualCodeDialogState extends State<_ManualCodeDialog> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final code = _controller.text.trim();

    return AlertDialog(
      title: Text(l.scanManualTitle),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l.scanManualHint, style: Theme.of(context).textTheme.bodySmall),
          const AppGap(ApSpace.s3),
          TextField(
            controller: _controller,
            autofocus: true,
            autocorrect: false,
            enableSuggestions: false,
            // The code is base64url: always left to right, whatever the UI language.
            textDirection: TextDirection.ltr,
            decoration: const InputDecoration(hintText: '7Qk2xZn9VrT4mLpA3bYc'),
            onChanged: (_) => setState(() {}),
            onSubmitted: (v) {
              if (v.trim().length >= 6) Navigator.of(context).pop(v.trim());
            },
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(l.commonCancel)),
        FilledButton(
          onPressed: code.length < 6 ? null : () => Navigator.of(context).pop(code),
          child: Text(l.scanValidate),
        ),
      ],
    );
  }
}
