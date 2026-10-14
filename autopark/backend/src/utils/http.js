/**
 * Turns any error into a safe HTTP answer.
 *
 * The controllers used to reply `{ message: 'Server error', error:
 * error.message }` — handing Mongo internals to anyone who asked, including
 * another user's email on a duplicate-key error — and answered 500 for things
 * that were the caller's fault (a malformed id, a failed validation). Every
 * catch block now goes through here, and so does the global error handler.
 */

const logger = require('./logger');

// The request's own logger (from pino-http) carries its id and route.
const log = (error, req) => (req && req.log ? req.log : logger).error({ err: error }, 'unhandled error');

const describe = (error) => {
  if (!error) return { status: 500, body: { message: 'Server error' } };

  // Body-parser errors carry a 4xx status too, but their message quotes the
  // parser ("Expected double-quoted property name at position 27"): checked
  // first so the client gets a stable, translatable message instead.
  if (error.type === 'entity.parse.failed') {
    return { status: 400, body: { message: 'Malformed JSON body' } };
  }
  if (error.type === 'entity.too.large') {
    return { status: 413, body: { message: 'Request body too large' } };
  }

  // Errors we raise on purpose carry their own status (AvailabilityError,
  // PaymentError, express-validator style objects).
  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
    return { status: error.status, body: { message: error.message } };
  }
  // findById('not-an-id') and friends.
  if (error.name === 'CastError') {
    return { status: 400, body: { message: 'Invalid id' } };
  }
  if (error.name === 'ValidationError' && error.errors) {
    return {
      status: 400,
      body: {
        message: 'Validation failed',
        errors: Object.values(error.errors).map((e) => ({ field: e.path, message: e.message })),
      },
    };
  }
  // Duplicate key: say what kind of conflict, never echo the value.
  if (error.code === 11000) {
    return { status: 409, body: { message: 'Already exists' } };
  }
  return { status: 500, body: { message: 'Server error' } };
};

/** For catch blocks: `catch (error) { serverError(res, error); }` */
const serverError = (res, error, req) => {
  const { status, body } = describe(error);
  const request = req || res.req;
  if (status >= 500) log(error, request);
  if (res.headersSent) return undefined;
  // The id lets support find this exact failure in the logs; nothing else
  // about it leaves the server.
  if (status >= 500 && request && request.id) body.requestId = request.id;
  return res.status(status).json(body);
};

/** Express error middleware — the last stop for anything thrown or next(err)'d. */
// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => serverError(res, error, req);

module.exports = { serverError, errorHandler, describe };
