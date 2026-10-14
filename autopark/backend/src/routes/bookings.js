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
  extend,
  checkIn,
  checkInByToken,
  checkOut,
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

// PATCH /api/bookings/:id/extend — a driver extends their own active booking
router.patch('/:id/extend', protect, extend);

// POST /api/bookings/check-in — by QR token alone (scanner, typed code)
router.post('/check-in', protect, authorize('admin', 'parking_owner', 'technicien'), checkInByToken);

// POST /api/bookings/:id/check-in — owner or technician validates arrival
router.post('/:id/check-in', protect, authorize('admin', 'parking_owner', 'technicien'), checkIn);

// POST /api/bookings/:id/check-out — owner or technician records departure
router.post('/:id/check-out', protect, authorize('admin', 'parking_owner', 'technicien'), checkOut);

// GET /api/reservations — user's booking history
router.get('/', protect, getUserReservations);

module.exports = router;
