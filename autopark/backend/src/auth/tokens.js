const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

/**
 * Sessions: short access tokens, rotating refresh tokens, and revocation.
 *
 * Every client picks its mode with the X-Auth-Mode header on login,
 * register, refresh and change-password:
 *
 *   (none)   legacy — one long-lived token in `token`, exactly what every
 *            client has always received. Old app builds keep working.
 *   refresh  short access token in `token`, plus `refreshToken` in the body.
 *            The mobile app keeps it in the platform keystore.
 *   cookie   short access token in `token`; the refresh token goes into an
 *            httpOnly cookie that page scripts cannot read. The web portal.
 *
 * Whatever the mode, every token is checked against the account on each
 * request: a disabled account, or a token issued before the account's
 * tokenVersion was bumped (password change, "sign out everywhere"), is
 * refused — so even a legacy 7-day token can now be revoked.
 */

const num = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const config = () => ({
  accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshDays: num('REFRESH_TOKEN_DAYS', 30),
  // Two tabs refreshing at the same moment present the same token; within
  // this window the second one is not treated as theft.
  reuseGraceMs: num('REFRESH_REUSE_GRACE_MS', 30 * 1000),
  cookie: {
    name: 'ap_rt',
    path: process.env.REFRESH_COOKIE_PATH || '/api/auth',
    sameSite: (process.env.REFRESH_COOKIE_SAMESITE || 'strict').toLowerCase(),
    secure: process.env.REFRESH_COOKIE_SECURE
      ? process.env.REFRESH_COOKIE_SECURE === '1'
      : process.env.NODE_ENV === 'production',
  },
});

class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

const MODES = ['refresh', 'cookie'];
const modeOf = (req) => {
  const mode = String(req.get('X-Auth-Mode') || '').toLowerCase();
  return MODES.includes(mode) ? mode : 'legacy';
};

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');
const expiryOf = (token) => new Date(jwt.decode(token).exp * 1000).toISOString();

/** The public view of an account, as login and /auth/me return it. */
const publicUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  profilePic: user.profilePic,
  CNE: user.CNE,
});

/**
 * Verifies an access token and returns the live account, or throws.
 * Used by `protect`, `optionalAuth` and the socket handshake.
 */
const authenticate = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AuthError(
      error.name === 'TokenExpiredError' ? 'Not authorized, token expired' : 'Not authorized, token invalid'
    );
  }
  const user = await User.findById(decoded.id).select('+tokenVersion');
  if (!user) throw new AuthError('User not found');
  if (user.isActive === false) throw new AuthError('This account has been disabled');
  if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
    throw new AuthError('Session expired, please sign in again');
  }
  return user;
};

const issueRefresh = async (user, req, family = crypto.randomUUID()) => {
  const { refreshDays } = config();
  const token = crypto.randomBytes(48).toString('base64url');
  const doc = await RefreshToken.create({
    userId: user._id,
    tokenHash: hash(token),
    family,
    expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
    userAgent: String(req.get('user-agent') || '').slice(0, 200),
    ip: String(req.ip || ''),
  });
  return { token, doc };
};

const setRefreshCookie = (res, token, expires) => {
  const { cookie } = config();
  res.cookie(cookie.name, token, {
    httpOnly: true,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
    expires,
  });
};

const clearRefreshCookie = (res) => {
  const { cookie } = config();
  res.clearCookie(cookie.name, {
    httpOnly: true,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
  });
};

/**
 * Builds the token part of a login/register/refresh response for the
 * caller's mode. `family` continues an existing device session on refresh.
 */
const startSession = async (req, res, user, { mode = modeOf(req), family } = {}) => {
  if (mode === 'legacy') return { token: user.generateToken() };

  const token = user.generateToken({ expiresIn: config().accessTtl });
  const refresh = await issueRefresh(user, req, family);
  const out = {
    token,
    accessTokenExpiresAt: expiryOf(token),
    refreshTokenExpiresAt: refresh.doc.expiresAt.toISOString(),
  };
  if (mode === 'cookie') setRefreshCookie(res, refresh.token, refresh.doc.expiresAt);
  else out.refreshToken = refresh.token;
  return { ...out, refreshDoc: refresh.doc };
};

/**
 * Trades a refresh token for a new access token and a new refresh token.
 * Returns { user, family }; throws AuthError when the token is no good.
 */
const rotate = async (presented) => {
  const now = new Date();
  const tokenHash = hash(presented);

  // Atomic: of two concurrent uses of one token, exactly one gets here.
  let current = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
    { $set: { revokedAt: now, revokedReason: 'rotated' } }
  );

  if (!current) {
    const known = await RefreshToken.findOne({ tokenHash });
    if (!known || known.expiresAt <= now) throw new AuthError('Invalid refresh token');

    const benignRace =
      known.revokedReason === 'rotated' &&
      now - known.revokedAt < config().reuseGraceMs &&
      // ...unless the device has since signed out or been revoked.
      !(await RefreshToken.exists({ family: known.family, revokedReason: { $in: ['logout', 'reuse', 'revoked'] } }));

    if (!benignRace) {
      // A rotated token came back: someone else has a copy. End that device's session.
      await RefreshToken.updateMany(
        { family: known.family, revokedAt: null },
        { $set: { revokedAt: now, revokedReason: 'reuse' } }
      );
      throw new AuthError('Session expired, please sign in again');
    }
    current = known;
  }

  const user = await User.findById(current.userId).select('+tokenVersion');
  if (!user) throw new AuthError('User not found');
  if (user.isActive === false) throw new AuthError('This account has been disabled');

  return { user, family: current.family, previous: current };
};

/** Ends one device's session (the family the presented token belongs to). */
const revokeFamilyOf = async (presented) => {
  if (typeof presented !== 'string' || !presented) return false;
  const known = await RefreshToken.findOne({ tokenHash: hash(presented) }).select('family');
  if (!known) return false;
  await RefreshToken.updateMany(
    { family: known.family, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: 'logout' } }
  );
  return true;
};

/**
 * Revokes everything an account holds: every refresh token, and — through
 * tokenVersion — every access token, legacy ones included.
 */
const revokeAll = async (userId) => {
  await Promise.all([
    User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } }),
    RefreshToken.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'revoked' } }
    ),
  ]);
};

module.exports = {
  AuthError,
  authenticate,
  clearRefreshCookie,
  config,
  hash,
  modeOf,
  publicUser,
  revokeAll,
  revokeFamilyOf,
  rotate,
  startSession,
};
