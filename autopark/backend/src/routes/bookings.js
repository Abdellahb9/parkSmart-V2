const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const {
  create,
  getById,
  cancel,
  getUserReservations,
  complete,
} = require('../controllers/bookingController');

// POST /api/bookings — user only, atomic spot reservation
router.post(
  '/',
  protect,
  authorize('user'),
  [
    body('parkingId').notEmpty().withMessage('Parking ID is required'),
    body('spotNumber').isInt({ min: 1 }).withMessage('Spot number is required'),
    body('carPlate').notEmpty().withMessage('Car plate is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
  ],
  validate,
  create
);

// GET /api/bookings/:id — booking detail
router.get('/:id', protect, getById);

// PATCH /api/bookings/:id/cancel — cancellation with fee
router.patch('/:id/cancel', protect, cancel);

// PATCH /api/bookings/:id/complete — mark booking as done
router.patch('/:id/complete', protect, authorize('admin', 'parking_owner'), complete);

// GET /api/reservations — user's booking history
router.get('/', protect, getUserReservations);

module.exports = router;
