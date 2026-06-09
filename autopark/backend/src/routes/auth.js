const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const { register, login, getMe, updateMe } = require('../controllers/authController');

// POST /api/auth/register — user only
router.post(
  '/register',
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim(),
  ],
  validate,
  register
);

// POST /api/auth/login — all roles
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// GET /api/auth/me — current user profile
router.get('/me', protect, getMe);

// PATCH /api/auth/me — update profile
router.patch('/me', protect, updateMe);

module.exports = router;
