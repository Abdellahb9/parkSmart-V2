const pino = require('pino');

/**
 * One structured logger for the whole API.
 *
 * JSON lines in production (what a log collector wants), a readable coloured
 * stream in development, nothing at all under Jest. Credentials are redacted
 * wherever they might appear, even though the request serializer below never
 * includes headers or bodies in the first place.
 */
const env = process.env.NODE_ENV || 'development';
const level = process.env.LOG_LEVEL || (env === 'test' ? 'silent' : 'info');

let transport;
if (env === 'development' && process.env.LOG_PRETTY !== '0') {
  try {
    require.resolve('pino-pretty');
    transport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
    };
  } catch {
    // pino-pretty is a dev dependency; without it, plain JSON is fine.
  }
}

const logger = pino({
  level,
  base: { service: 'autopark-api' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.currentPassword',
      '*.newPassword',
      '*.refreshToken',
      '*.token',
    ],
    censor: '[redacted]',
  },
  transport,
});

module.exports = logger;
