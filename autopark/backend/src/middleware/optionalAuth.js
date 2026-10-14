const { authenticate } = require('../auth/tokens');

// Populates req.user when a valid Bearer token is present, and quietly
// continues when it is absent, invalid, revoked or belongs to a disabled
// account.
//
// Unlike `protect`, this never rejects: the route stays public, but the
// controller can give a signed-in caller more than an anonymous one.
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = await authenticate(header.split(' ')[1]);
    } catch {
      // Treat the caller as anonymous rather than failing.
    }
  }
  next();
};

module.exports = optionalAuth;
