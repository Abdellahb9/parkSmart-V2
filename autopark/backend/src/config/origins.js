// Browser origins allowed to call the API and open a socket.
// Requests with no Origin header (the native mobile app, curl) are always
// allowed: the Origin check only ever protects browsers.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = { allowedOrigins };
