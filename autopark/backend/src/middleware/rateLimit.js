const rateLimit = require('express-rate-limit');

// The credential endpoints are the guessing surface, and bcrypt cost 12 makes
// each attempt expensive for the server too — so an unthrottled login is both a
// credential-stuffing vector and a cheap CPU-exhaustion DoS.
//
// Successful logins do not consume quota, so a legitimate user signing in
// repeatedly is never locked out; only failed attempts count.
const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.' },
});

module.exports = { authLimiter };

// Refresh is called silently by the apps, so it gets more room; only
// failures (an invalid or replayed token) count against it.
const refreshLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.REFRESH_RATE_LIMIT_MAX || 30),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

module.exports.refreshLimiter = refreshLimiter;
