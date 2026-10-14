const { authenticate } = require('../auth/tokens');

// Requires a valid, unrevoked access token from an active account.
// The account is re-read on every request, so a role change, a disabled
// account or a revoked session takes effect immediately, not at expiry.
const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer') ? header.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    req.user = await authenticate(token);
    return next();
  } catch (error) {
    return res.status(401).json({ message: error.status === 401 ? error.message : 'Not authorized, token invalid' });
  }
};

module.exports = protect;
