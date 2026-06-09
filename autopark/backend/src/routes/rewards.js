const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const { getRewards, createReward } = require('../controllers/rewardController');

// GET /api/rewards — user's loyalty + available rewards
router.get('/', protect, getRewards);

// POST /api/rewards — create reward (admin only)
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('requiredBookings').isInt({ min: 1 }).withMessage('Required bookings must be at least 1'),
    body('type').isIn(['free_wash', 'discount_coupon', 'free_vidange', 'free_reservation']).withMessage('Invalid reward type'),
  ],
  validate,
  createReward
);

module.exports = router;
