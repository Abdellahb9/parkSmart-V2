# AutoPark — smart parking for Laâyoune

AutoPark connects drivers, parking owners, street technicians and the city's
administrators around one live picture of parking in Laâyoune: which spots are
free right now — or free tonight between 18:00 and 20:00 — who booked them,
who paid, and who is overstaying.

| Who | Where | What they do |
|---|---|---|
| **Drivers** | Mobile app | Find a parking on the map, book a time slot and a spot, pay (wallet, card or cash), show a QR at the entrance, extend a stay, file complaints, collect loyalty rewards |
| **Technicians** | Mobile app | Scan drivers' QR codes on public streets, check spots, issue fines with photo evidence |
| **Parking owners** | Web portal | Live spot grid, reservations with overstays, check-in/out, payments, revenue reports (CSV/PDF), complaints, rewards |
| **Administrators** | Web portal | The whole network: map, parkings, accounts (create, disable), reservations, payments, revenue, complaints |

French and Arabic (right-to-left) throughout, prices in MAD.

---

## Contents

- [Architecture](#architecture)
- [Quick start with Docker](#quick-start-with-docker)
- [Local development](#local-development)
- [Demo accounts](#demo-accounts)
- [Configuration](#configuration)
- [How it works](#how-it-works)
- [API at a glance](#api-at-a-glance)
- [Tests](#tests)
- [Repository layout](#repository-layout)
- [Known limitations](#known-limitations)

---

## Architecture

```
   Drivers & technicians              Owners & admins
   ┌────────────────────┐             ┌────────────────────┐
   │  Flutter app       │             │  React portal      │
   │  (Android / iOS)   │             │  (Vite, Tailwind)  │
   └─────────┬──────────┘             └─────────┬──────────┘
             │  REST + socket.io                │  same origin (nginx)
             └───────────────┬──────────────────┘
                     ┌───────▼────────┐        ┌─────────────┐
                     │  Express API   │───────▶│  MongoDB    │
                     │  + socket.io   │        └─────────────┘
                     │  + jobs        │
                     └────────────────┘
```

| Part | Stack |
|---|---|
| `autopark/backend` | Node.js 22, Express 4, Mongoose 8, socket.io 4, pino, pdfkit; Jest + Supertest |
| `autopark/web` | React 19, Vite, Tailwind CSS 4, zustand, react-i18next, Leaflet, socket.io-client |
| `autopark/mobile` | Flutter 3.27+, go_router, provider, flutter_secure_storage, mobile_scanner, gen-l10n |
| `design/` | Design tokens (JSON) generating the web theme and the Flutter theme from one source |

---

## Quick start with Docker

Needs Docker with Compose v2.

```bash
cp .env.example .env
```

Edit `.env`: set `JWT_SECRET` (at least 32 random characters, for example the output of
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) and the four
`SEED_*_PASSWORD` values.

```bash
docker compose up -d --build
```

```bash
docker compose --profile tools run --rm seed
```

Open **http://localhost:8080**. The seed task **wipes the database** and loads the demo network;
skip it to start empty. Other tasks:

```bash
docker compose --profile tools run --rm migrate
```

```bash
docker compose logs -f api
```

The stack runs MongoDB (not published), the API (not published) and nginx on port 8080, which
serves the portal and proxies `/api` and `/socket.io` to the API. To point the mobile app at it,
build with `--dart-define=API_BASE_URL=http://<this machine's IP>:8080/api`.

Serving over HTTPS? Set `REFRESH_COOKIE_SECURE=1` and `PUBLIC_ORIGIN=https://your-domain`.

---

## Local development

Needs Node.js 20.19+ (22 recommended), MongoDB 7 on `localhost:27017`, and Flutter 3.27+ for the app.

**API** — http://localhost:5000

```bash
cd autopark/backend
```

```bash
cp .env.example .env
```

```bash
npm install
```

```bash
npm run seed
```

```bash
npm run dev
```

**Web portal** — http://localhost:5173 (Vite proxies `/api` and `/socket.io` to port 5000)

```bash
cd autopark/web
```

```bash
npm install
```

```bash
npm run dev
```

**Mobile app** — the default API address is the Android emulator's view of your machine
(`http://10.0.2.2:5000/api`). On a physical phone, pass your machine's LAN address:

```bash
cd autopark/mobile
```

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:5000/api
```

Upgrading an existing database rather than reseeding? Run the migrations (idempotent; each
accepts `--dry` to preview):

```bash
npm run migrate
```

---

## Demo accounts

Created by the seed. Passwords come from the `SEED_*_PASSWORD` variables; for local development
only, `autopark/backend/seed.js` has defaults. **Never deploy with those defaults.**

| Role | Accounts | Signs in on |
|---|---|---|
| Admin | `admin@autopark.ma` | Web |
| Parking owners | `owner1@autopark.ma` (Al Massira, Centre Ville, N5, the streets), `owner2@autopark.ma` (Place Dchira, Souk Jemal), `owner3@autopark.ma` (Colomina, Hay Al Wahda, Airport) | Web |
| Technicians | `tech1@autopark.ma`, `tech2@autopark.ma` | Mobile |
| Drivers | `ahmed@autopark.ma`, `fatima@autopark.ma`, and 170 more | Mobile |

The seeded network: 13 parkings (8 car parks, 5 public streets), 60 days of history (about
10 000 bookings and 9 000 payments that add up: wallet top-ups, card declines, cash collected
at the exit, refunds, commissions), what is happening right now (cars inside, spots held,
bookings for tonight and tomorrow, one overstay), complaints and fines. Ahmed is inside Parking
Al Massira and has a booking tomorrow; Fatima is overstaying at Centre Ville.

---

## Configuration

Every setting is an environment variable; `autopark/backend/.env.example` documents each one.
The server checks them at boot and refuses to start with a readable list of problems
(missing `JWT_SECRET`, a weak secret in production, an impossible cookie setting…).

| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URI` | — | Required |
| `JWT_SECRET` | — | Required; ≥ 32 chars in production |
| `CORS_ORIGINS` | `http://localhost:5173` | Browser origins allowed to call the API; required in production |
| `ACCESS_TOKEN_TTL` | `15m` | Access token lifetime (portal and app) |
| `REFRESH_TOKEN_DAYS` | `30` | Refresh token lifetime |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime for older clients (legacy mode) |
| `REFRESH_COOKIE_SECURE` | on in production | Secure flag on the portal's session cookie |
| `REFRESH_COOKIE_SAMESITE` | `strict` | `lax` / `none` for cross-site deployments |
| `TRUST_PROXY` | off | `1` behind one reverse proxy |
| `LOG_LEVEL` | `info` | pino level |
| `UNCHECKED_GRACE_MINUTES` | `120` | No-shows are released this long after their end |
| `OVERSTAY_AUTOCLOSE_HOURS` | `12` | Forgotten check-outs are closed after this |
| `PAYMENT_PROVIDER` | `mock` | Payment gateway adapter |

Web: `VITE_API_URL` (only when the API is on another origin). Mobile: `API_BASE_URL` dart-define.

---

## How it works

**Time-aware availability.** Bookings are the source of truth. A spot booked from 18:00 is still
bookable at 14:00; `GET /api/parkings/:id/spots?from=&to=` answers for a window, and the app
asks for the slot first, then shows only spots free for it. A per-spot lock plus an overlap check
make double booking impossible even without database transactions (a test fires 15 simultaneous
requests at one spot: exactly one wins). A background job releases no-shows, flags overstays,
closes forgotten check-outs and keeps the live spot colours right.

**Sessions.** The portal and the app get a 15-minute access token and a refresh token that
rotates on every use; replaying a used refresh token signs that device out (theft detection).
The portal's refresh token is an httpOnly, SameSite=Strict cookie no script can read; the app
keeps its token in the platform keystore. Changing a password, "sign out everywhere", or an admin
disabling an account revokes every session at once, closes open sockets, and takes effect on the
next request — including for older app builds still on 7-day tokens.

**Payments.** A provider interface with a mock gateway today (CMI later), a wallet, cash collected
at the barrier, refunds to the wallet on cancellation (minus a 20 % fee once active), and the
owner's commission recorded on every payment. Revenue reports export to CSV and PDF.

**Live updates.** socket.io pushes availability, check-ins and overstays to the map, the owner's
spot grid and the app.

**Languages.** French and Arabic everywhere, including right-to-left layouts, Arabic plural forms,
and API messages (`X-App-Language: fr|ar`).

---

## API at a glance

Base path `/api`. JSON in and out; authenticated routes take `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/change-password`; `GET/PATCH /auth/me` |
| Parkings | `GET /parkings`, `/parkings/near?lat=&lng=&radius=`, `/parkings/:id`, `/parkings/:id/spots[?from=&to=]`; admin `POST/PATCH` |
| Bookings | `POST /bookings`, `GET /bookings` (mine), `GET /bookings/:id`, `PATCH /bookings/:id/cancel`, `/extend`, `/complete`; staff `POST /bookings/check-in` (QR), `/bookings/:id/check-in`, `/check-out` |
| Payments | `GET /payments/wallet`, `/payments/my`; `POST /payments/topup`, `/payments/booking/:id`, `/payments/:id/confirm`; staff `GET /payments`, `POST /payments/:id/collect` |
| Reports | `GET /reports/revenue?from=&to=&format=json|csv|pdf` |
| Admin | `GET /admin/users`, `POST /admin/users`, `PATCH /admin/users/:id/status`, `GET /admin/reservations`, `/admin/complaints`, `/admin/stats` |
| Owner | `GET /owner/dashboard`, `/owner/reservations`, `/owner/complaints`, `/owner/rewards` |
| Technician | `GET /technicien/streets`, `/technicien/streets/:id/spots`, `/technicien/fines`; `POST /technicien/fines` (multipart photo) |
| Other | `GET/POST /complaints`, `PATCH /complaints/:id/resolve`, `GET/POST /rewards`, `GET /health` |

Opt-in conventions, all backward compatible:

- **Pagination** — `?page=&limit=` on lists. Bodies stay arrays; totals come in `X-Total-Count`,
  `X-Page`, `X-Limit`, `X-Pages`. Without parameters, lists are capped at 1 000 rows.
- **Envelope** — send `X-Response-Envelope: 1` to receive `{ success, data, error, meta }`.
- **Sessions** — send `X-Auth-Mode: refresh` (body) or `cookie` (httpOnly cookie) on login;
  without it you get the original single long-lived token.
- **Language** — `X-App-Language: fr|ar` translates messages.
- **Tracing** — every response carries `X-Request-Id`, also returned in 500 bodies and written
  to the logs.

---

## Tests

```bash
cd autopark/backend && npm test
```

125 tests against a throwaway `autopark_test` database on the local MongoDB (the suite refuses
any database whose name does not end in `_test`; override with `MONGODB_URI_TEST`). They cover
time-aware booking and the double-booking race, the availability job, tenancy and permissions,
payments and refunds, sessions (rotation, replay detection, revocation, disabled accounts),
injection, error mapping, pagination, geo search, reports and the envelope.

```bash
cd autopark/mobile && flutter analyze && flutter test
```

36 tests: widgets (loading, error, empty states; buttons), French/Arabic catalogue parity and
Arabic plurals, models (overnight bookings, JSON parsing), QR payload parsing.

```bash
cd autopark/web && npm run build
```

The build checks that French and Arabic translations have the same keys.

---

## Repository layout

```
.
├── docker-compose.yml        the whole stack
├── design/                   design tokens → web theme + Flutter theme
├── docs/                     design-token documentation
└── autopark/
    ├── backend/
    │   ├── src/
    │   │   ├── auth/         sessions and token checks
    │   │   ├── config/       env validation, database, CORS
    │   │   ├── controllers/  route handlers
    │   │   ├── i18n/         French/Arabic API messages
    │   │   ├── jobs/         availability job
    │   │   ├── middleware/   auth, roles, language, envelope, sanitizer, uploads
    │   │   ├── models/       Mongoose schemas
    │   │   ├── payments/     provider interface + mock gateway
    │   │   ├── realtime/     socket.io server and events
    │   │   ├── routes/
    │   │   ├── services/     availability (overlaps, spot lock, live cache)
    │   │   └── utils/        errors, logging, pagination, ownership
    │   ├── migrations/       001–003, idempotent, --dry
    │   ├── seed/ seed.js     demo network
    │   └── tests/            Jest + Supertest
    ├── web/src/
    │   ├── components/ui/    design system (DataTable, Modal, AsyncState…)
    │   ├── features/         admin, owner, common pages
    │   ├── layouts/ router/ store/ services/ hooks/ i18n/ lib/
    └── mobile/lib/
        ├── core/             API client, sessions, realtime, locale, theme
        ├── design/           generated tokens + theme
        ├── features/         map, booking, reservations, wallet, profile, technician
        ├── l10n/             ARB catalogues (fr, ar)
        ├── models/ repositories/ widgets/
```

---

## Known limitations

- **Push notifications** are not wired yet: they need a Firebase project and service-account key.
- **Payments** run on the mock gateway; the CMI adapter needs merchant credentials.
- **Content typed into the database** (parking names, reward titles, fine reasons, complaint
  text) is shown as entered; only the interface and API messages are translated.
- **Fine photos** are visible to the technician who issued the fine (and stored outside the
  public uploads folder); there is no admin viewer yet.
- **Billing** charges per started hour; `pricePerDay` is stored and displayed but not yet used
  to cap long stays.
