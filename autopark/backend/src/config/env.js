/**
 * Fails fast on a broken configuration.
 *
 * A missing JWT_SECRET used to surface as a 500 on the first login, and a
 * missing MONGODB_URI as an opaque driver error; a weak secret in production
 * never surfaced at all. Checked once at boot, before anything listens.
 */
const problems = [];

const validate = (env = process.env) => {
  problems.length = 0;
  const production = env.NODE_ENV === 'production';

  if (!env.MONGODB_URI) problems.push('MONGODB_URI is required (e.g. mongodb://localhost:27017/autopark).');

  if (!env.JWT_SECRET) {
    problems.push('JWT_SECRET is required.');
  } else if (production && env.JWT_SECRET.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters in production.');
  } else if (production && /change-me|secret|autopark/i.test(env.JWT_SECRET)) {
    problems.push('JWT_SECRET looks like a placeholder; generate a random one for production.');
  }

  if (env.PORT && !/^\d+$/.test(env.PORT)) problems.push('PORT must be a number.');

  if (production && !env.CORS_ORIGINS) {
    problems.push('CORS_ORIGINS must list the web origin(s) in production.');
  }

  for (const name of ['UNCHECKED_GRACE_MINUTES', 'OVERSTAY_AUTOCLOSE_HOURS', 'EARLY_CHECKIN_MINUTES']) {
    if (env[name] !== undefined && !(Number(env[name]) >= 0)) problems.push(`${name} must be a non-negative number.`);
  }

  if (env.ACCESS_TOKEN_TTL && !/^[0-9]+[smhd]?$/.test(env.ACCESS_TOKEN_TTL)) {
    problems.push('ACCESS_TOKEN_TTL must look like 15m, 900s, 1h or a number of seconds.');
  }
  if (env.REFRESH_TOKEN_DAYS !== undefined && !(Number(env.REFRESH_TOKEN_DAYS) > 0)) {
    problems.push('REFRESH_TOKEN_DAYS must be a positive number.');
  }
  const sameSite = (env.REFRESH_COOKIE_SAMESITE || 'strict').toLowerCase();
  if (!['strict', 'lax', 'none'].includes(sameSite)) {
    problems.push('REFRESH_COOKIE_SAMESITE must be strict, lax or none.');
  }
  const secureCookie = env.REFRESH_COOKIE_SECURE ? env.REFRESH_COOKIE_SECURE === '1' : production;
  if (sameSite === 'none' && !secureCookie) {
    problems.push('REFRESH_COOKIE_SAMESITE=none requires REFRESH_COOKIE_SECURE=1 (browsers reject it otherwise).');
  }

  if (problems.length) {
    const message = ['Invalid configuration:', ...problems.map((p) => `  - ${p}`)].join('\n');
    const error = new Error(message);
    error.problems = [...problems];
    throw error;
  }
  return true;
};

module.exports = { validate };
