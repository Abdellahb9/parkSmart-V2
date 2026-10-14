/**
 * Strips MongoDB operators out of everything a client sends.
 *
 * Without this, `{"email": {"$ne": null}, "password": "x"}` turns a lookup
 * into a query of the attacker's choosing — express-validator catches the
 * login form, but not every route validates every field. Keys that start with
 * `$` or contain `.` are never legitimate in this API's input, so they are
 * removed (not rejected) wherever they appear, at any depth.
 */
const isUnsafeKey = (key) => key.startsWith('$') || key.includes('.');

const clean = (value, depth = 0) => {
  if (depth > 20 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) value[i] = clean(value[i], depth + 1);
    return value;
  }
  // Buffers, dates and the like are not user-shaped objects.
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    return value;
  }
  for (const key of Object.keys(value)) {
    if (isUnsafeKey(key)) delete value[key];
    else value[key] = clean(value[key], depth + 1);
  }
  return value;
};

const sanitize = (req, res, next) => {
  if (req.body) clean(req.body);
  if (req.query) clean(req.query);
  if (req.params) clean(req.params);
  next();
};

module.exports = sanitize;
module.exports.clean = clean;
