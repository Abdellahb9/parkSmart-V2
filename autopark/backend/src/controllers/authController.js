const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const realtime = require('../realtime/emit');
const tokens = require('../auth/tokens');
const { serverError } = require('../utils/http');

const { publicUser } = tokens;

// The token part of a response, without the internal refresh document.
const session = async (req, res, user, options) => {
  const { refreshDoc, ...body } = await tokens.startSession(req, res, user, options);
  return { body, refreshDoc };
};

// POST /api/auth/register — user role only
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      role: 'user', // self-registration always creates user role
    });

    const { body } = await session(req, res, user);
    res.status(201).json({ ...body, user: publicUser(user) });
  } catch (error) {
    serverError(res, error);
  }
};

// POST /api/auth/login — all roles
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +tokenVersion');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Checked after the password, so a disabled account is only revealed to
    // someone who already knows its credentials.
    if (user.isActive === false) {
      return res.status(403).json({ message: 'This account has been disabled' });
    }

    const { body } = await session(req, res, user);
    res.json({ ...body, user: publicUser(user) });
  } catch (error) {
    serverError(res, error);
  }
};

// POST /api/auth/refresh — trade a refresh token for a fresh pair.
//
// The token comes from the body (mobile) or from the httpOnly cookie (web).
// The cookie path also demands a custom header: browsers only send one
// cross-origin after a CORS preflight, which a foreign site cannot pass, so a
// hostile page cannot refresh — or rotate away — the portal's session.
exports.refresh = async (req, res) => {
  try {
    const fromBody = typeof req.body?.refreshToken === 'string' && req.body.refreshToken;
    const fromCookie = req.cookies?.[tokens.config().cookie.name];
    const presented = fromBody || fromCookie;

    if (!presented) {
      return res.status(401).json({ message: 'Refresh token required' });
    }
    if (!fromBody && req.get('X-Requested-With') !== 'autopark-web') {
      return res.status(403).json({ message: 'Missing X-Requested-With header' });
    }

    let rotated;
    try {
      rotated = await tokens.rotate(presented);
    } catch (error) {
      if (!fromBody) tokens.clearRefreshCookie(res);
      if (error instanceof tokens.AuthError) return res.status(401).json({ message: error.message });
      throw error;
    }

    const { user, family, previous } = rotated;
    const { body, refreshDoc } = await session(req, res, user, {
      mode: fromBody ? 'refresh' : 'cookie',
      family,
    });
    if (refreshDoc && !previous.replacedBy) {
      await RefreshToken.updateOne({ _id: previous._id }, { $set: { replacedBy: refreshDoc._id } });
    }

    res.json({ ...body, user: publicUser(user) });
  } catch (error) {
    serverError(res, error);
  }
};

// POST /api/auth/logout — end this device's session. Always succeeds, so a
// client can call it with an expired access token, or twice.
exports.logout = async (req, res) => {
  try {
    const presented =
      (typeof req.body?.refreshToken === 'string' && req.body.refreshToken) ||
      req.cookies?.[tokens.config().cookie.name];
    await tokens.revokeFamilyOf(presented);
    tokens.clearRefreshCookie(res);
    res.json({ message: 'Signed out' });
  } catch (error) {
    serverError(res, error);
  }
};

// POST /api/auth/logout-all — sign out every device, this one included.
exports.logoutAll = async (req, res) => {
  try {
    await tokens.revokeAll(req.user._id);
    tokens.clearRefreshCookie(res);
    realtime.disconnectUser(String(req.user._id));
    res.json({ message: 'Signed out on every device' });
  } catch (error) {
    serverError(res, error);
  }
};

// POST /api/auth/change-password
//
// Revokes every other session — a stolen token or a device left signed in
// stops working — and hands this client a fresh one so it stays signed in.
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password +tokenVersion');

    if (!(await user.comparePassword(currentPassword))) {
      // 400, not 401: the session is fine, the form is wrong. A 401 would make
      // the apps sign the user out.
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    if (await user.comparePassword(newPassword)) {
      return res.status(400).json({ message: 'The new password must be different from the current one' });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    await tokens.revokeAll(user._id);
    realtime.disconnectUser(String(user._id));

    const fresh = await User.findById(user._id).select('+tokenVersion');
    const { body } = await session(req, res, fresh);
    res.json({ message: 'Password changed', ...body, user: publicUser(fresh) });
  } catch (error) {
    serverError(res, error);
  }
};

// GET /api/auth/me — current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePic: user.profilePic,
      CNE: user.CNE,
      createdAt: user.createdAt,
    });
  } catch (error) {
    serverError(res, error);
  }
};

// PATCH /api/auth/me — update profile
exports.updateMe = async (req, res) => {
  try {
    const allowedFields = ['phone', 'email', 'profilePic'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePic: user.profilePic,
      CNE: user.CNE,
    });
  } catch (error) {
    serverError(res, error);
  }
};
