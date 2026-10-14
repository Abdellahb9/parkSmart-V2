const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { allowedOrigins } = require('./config/origins');
const logger = require('./utils/logger');

const app = express();

// Behind a reverse proxy (Docker's nginx, a load balancer) req.ip must come
// from X-Forwarded-For, or every client shares the proxy's address and one
// person's failed logins rate-limit everyone. TRUST_PROXY=1 turns it on.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
app.disable('x-powered-by');

// One structured log line per request, tagged with an id that is also sent
// back as X-Request-Id and included in 500 responses, so a user's
// screenshot of an error can be matched to the server log.
const REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const incoming = req.headers['x-request-id'];
      const id = typeof incoming === 'string' && REQUEST_ID.test(incoming) ? incoming : crypto.randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    customLogLevel: (req, res, error) => {
      if (error || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    autoLogging: { ignore: (req) => req.url === '/api/health' },
    // Method, path and status only: no headers, no bodies, no tokens.
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  })
);

// Security headers: nosniff, frameguard, referrer-policy, HSTS, etc.
// crossOriginResourcePolicy is relaxed to 'cross-origin' so the web portal,
// which runs on a different origin, can still load files served from /uploads.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS: an explicit allowlist, replacing the previous wide-open cors().
// Requests with no Origin header (the native mobile app, curl, server-to-server)
// are allowed through — the Origin check only ever protects browsers.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      // Reject by withholding CORS headers rather than throwing a 500.
      return callback(null, false);
    },
    credentials: true,
    // Pagination totals and the revenue report's file name.
    exposedHeaders: [
      'X-Total-Count',
      'X-Page',
      'X-Limit',
      'X-Pages',
      'Content-Disposition',
      'X-Request-Id',
      'X-Response-Envelope',
    ],
  })
);

// Opt-in { success, data, error } envelope for clients that send
// X-Response-Envelope: 1. Mounted before the language middleware, so a
// message is translated first and wrapped second.
app.use(require('./middleware/envelope'));

// Translates API messages for clients that send X-App-Language; a no-op
// otherwise. Mounted before the body parsers so even a malformed-JSON error
// comes back in the client's language.
app.use(require('./middleware/language'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// The web portal's refresh token arrives as an httpOnly cookie.
app.use(cookieParser());

// Removes `$operator` and dotted keys from body, query and params.
app.use(require('./middleware/sanitize'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/parkings', require('./routes/parkings'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reservations', require('./routes/bookings')); // alias for user reservations
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/owner', require('./routes/owner'));
app.use('/api/technicien', require('./routes/technicien'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler: anything thrown or passed to next(err). Maps known
// errors to proper status codes and never sends internals or stack traces.
app.use(require('./utils/http').errorHandler);

module.exports = app;
