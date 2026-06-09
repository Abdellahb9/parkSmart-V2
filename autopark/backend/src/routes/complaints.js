const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const {
  create,
  getUserComplaints,
  getAll,
  resolve,
} = require('../controllers/complaintController');

// POST /api/complaints — submit complaint (user)
router.post(
  '/',
  protect,
  authorize('user'),
  [
    body('parkingId').notEmpty().withMessage('Parking ID is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  validate,
  create
);

// GET /api/complaints — user's complaints
router.get('/', protect, getUserComplaints);

// PATCH /api/complaints/:id/resolve — resolve complaint (admin/owner)
router.patch('/:id/resolve', protect, authorize('admin', 'parking_owner'), resolve);

module.exports = router;
