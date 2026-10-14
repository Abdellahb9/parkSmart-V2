# AutoPark — mobile app

The Flutter app for drivers (map, booking, payments, QR entry, complaints,
loyalty) and technicians (street checks, QR validation, fines with photos).
French and Arabic, right-to-left included.

See the [project README](../../README.md) for the whole platform.

## Run

```bash
flutter pub get
```

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:5000/api
```

Without `API_BASE_URL` the app targets the Android emulator's view of your
machine (`http://10.0.2.2:5000/api`). Against the Docker stack, use port 8080.

## Check

```bash
flutter analyze
```

```bash
flutter test
```

## Notes

- Strings live in `lib/l10n/app_fr.arb` and `app_ar.arb`; regenerate with
  `flutter gen-l10n`. `test/l10n_test.dart` fails if the two drift apart.
- Theme tokens in `lib/design/app_tokens.g.dart` are generated from
  `design/tokens` at the repository root: `node design/build-tokens.mjs`.
- Sessions: a 15-minute access token and a rotating refresh token, both in the
  platform keystore (`lib/core/token_storage.dart`); `ApiService` renews the
  access token on a 401 and replays the request.
