const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const optionalAuth = require('../middleware/optionalAuth');
const {
  getAll,
  getNear,
  getById,
  getSpots,
  create,
  update,
} = require('../controllers/parkingController');

// GET /api/parkings — public listing; signed-in callers see more (see controller)
router.get('/', optionalAuth, getAll);

// GET /api/parkings/near?lat=&lng=&radius= — closest first. Declared before
// /:id so 'near' is never read as an id.
router.get('/near', optionalAuth, getNear);

// GET /api/parkings/:id — public detail; signed-in callers see more
router.get('/:id', optionalAuth, getById);

// GET /api/parkings/:id/spots — live occupancy map, for signed-in users only
router.get('/:id/spots', protect, getSpots);

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
