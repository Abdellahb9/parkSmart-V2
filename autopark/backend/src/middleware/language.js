const { SUPPORTED, translate } = require('../i18n/messages');

/**
 * Localizes the human-readable parts of a JSON response.
 *
 * Opt-in through `X-App-Language: fr|ar`, sent only by the apps that know how
 * to display it. Every other caller — older app builds, scripts, curl — gets
 * the exact English responses they always have. Accept-Language is ignored on
 * purpose: browsers send it unprompted, which would change responses under a
 * client that never asked.
 *
 * Only human-readable text is touched: `message`, `errors[].message`, and a
 * declined payment's `failureReason`. Data fields never are.
 */
const language = (req, res, next) => {
  const requested = String(req.get('X-App-Language') || '').toLowerCase().slice(0, 2);
  req.lang = SUPPORTED.includes(requested) ? requested : null;
  if (!req.lang) return next();

  const json = res.json.bind(res);
  res.json = (body) => {
    // Plain objects only. A Mongoose document passed straight to res.json
    // (res.json(booking)) must reach JSON.stringify untouched: spreading it
    // would serialize its internals instead of its fields.
    const plain = body && typeof body === 'object' && Object.getPrototypeOf(body) === Object.prototype;
    if (plain) {
      const out = { ...body };
      if (typeof out.message === 'string') out.message = translate(out.message, req.lang);
      if (Array.isArray(out.errors)) {
        out.errors = out.errors.map((e) =>
          e && typeof e.message === 'string' ? { ...e, message: translate(e.message, req.lang) } : e
        );
      }
      if (out.payment && typeof out.payment.failureReason === 'string' && out.payment.failureReason) {
        const payment = typeof out.payment.toObject === 'function' ? out.payment.toObject() : { ...out.payment };
        payment.failureReason = translate(payment.failureReason, req.lang);
        out.payment = payment;
      }
      // Internal error detail is for logs, not for a translated user message.
      if (out.message && out.error && res.statusCode >= 500) delete out.error;
      return json(out);
    }
    return json(body);
  };
  return next();
};

module.exports = language;
