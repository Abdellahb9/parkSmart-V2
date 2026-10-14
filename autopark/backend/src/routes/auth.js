const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const { authLimiter, refreshLimiter } = require('../middleware/rateLimit');
const {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  changePassword,
  getMe,
  updateMe,
} = require('../controllers/authController');

// POST /api/auth/register — user only
router.post(
  '/register',
  authLimiter,
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isString().withMessage('Password must be at least 6 characters').bail().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim(),
  ],
  validate,
  register
);

// POST /api/auth/login — all roles
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    // isString: an object here (after the sanitizer strips its $-keys) used to
    // reach bcrypt and crash the request with a 500.
    body('password').isString().withMessage('Password is required').bail().notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// POST /api/auth/refresh — new access token from a refresh token (body or cookie)
router.post('/refresh', refreshLimiter, refresh);

// POST /api/auth/logout — end this device's session
router.post('/logout', logout);

// POST /api/auth/logout-all — end every session of the signed-in account
router.post('/logout-all', protect, logoutAll);

// POST /api/auth/change-password — revokes every other session
router.post(
  '/change-password',
  protect,
  authLimiter,
  [
    body('currentPassword').isString().withMessage('Current password is required').bail().notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isString()
      .withMessage('New password must be at least 8 characters')
      .bail()
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be at least 8 characters'),
  ],
  validate,
  changePassword
);

// GET /api/auth/me — current user profile
router.get('/me', protect, getMe);

// PATCH /api/auth/me — update profile
router.patch('/me', protect, updateMe);

module.exports = router;
