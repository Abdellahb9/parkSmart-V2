const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const {
  getAll,
  getById,
  getSpots,
  create,
  update,
} = require('../controllers/parkingController');

// GET /api/parkings — all parkings with availability
router.get('/', getAll);

// GET /api/parkings/:id — parking detail
router.get('/:id', getById);

// GET /api/parkings/:id/spots — spots array for booking UI
router.get('/:id/spots', getSpots);

// POST /api/parkings — admin only
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Parking name is required'),
    body('ownerId').notEmpty().withMessage('Owner is required'),
    body('type').isIn(['normal', 'open_street']).withMessage('Type must be normal or open_street'),
    body('latitude').isFloat().withMessage('Valid latitude is required'),
    body('longitude').isFloat().withMessage('Valid longitude is required'),
    body('totalSpots').isInt({ min: 1 }).withMessage('Total spots must be at least 1'),
    body('pricePerHour').isFloat({ min: 0 }).withMessage('Price per hour is required'),
  ],
  validate,
  create
);

// PATCH /api/parkings/:id — admin only
router.patch('/:id', protect, authorize('admin'), update);

module.exports = router;
