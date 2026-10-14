/**
 * Opt-in response envelope: { success, data, error, meta? }.
 *
 * A client that sends `X-Response-Envelope: 1` gets every JSON response in one
 * predictable shape:
 *
 *   200  { success: true,  data: <body>, error: null, meta?: { total, page, limit, pages } }
 *   4xx  { success: false, data: null,   error: { status, message, errors?, requestId?, details? } }
 *
 * Every other client — the current web portal and mobile app, scripts, curl —
 * gets the bodies it always got. Files (CSV, PDF) are never wrapped.
 *
 * Mounted before the language middleware, so messages are translated first
 * and wrapped second.
 */
const ENVELOPE_HEADER = 'X-Response-Envelope';

const metaFrom = (res) => {
  const total = res.get('X-Total-Count');
  if (total === undefined) return undefined;
  const meta = { total: Number(total) };
  for (const [key, header] of [
    ['page', 'X-Page'],
    ['limit', 'X-Limit'],
    ['pages', 'X-Pages'],
  ]) {
    const value = res.get(header);
    if (value !== undefined) meta[key] = Number(value);
  }
  return meta;
};

const envelope = (req, res, next) => {
  if (req.get(ENVELOPE_HEADER) !== '1') return next();

  const json = res.json.bind(res);
  res.set(ENVELOPE_HEADER, '1');
  res.json = (body) => {
    if (res.statusCode < 400) {
      const meta = metaFrom(res);
      return json({ success: true, data: body === undefined ? null : body, error: null, ...(meta ? { meta } : {}) });
    }

    const plain = body && typeof body === 'object' && !Array.isArray(body) ? body : { message: String(body ?? '') };
    const { message, errors, requestId, ...details } = plain;
    const error = { status: res.statusCode, message: message || 'Request failed' };
    if (errors) error.errors = errors;
    if (requestId) error.requestId = requestId;
    if (Object.keys(details).length) error.details = details;
    return json({ success: false, data: null, error });
  };
  return next();
};

module.exports = envelope;
module.exports.ENVELOPE_HEADER = ENVELOPE_HEADER;
