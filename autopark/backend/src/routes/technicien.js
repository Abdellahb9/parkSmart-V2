const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const {
  getStreets,
  getStreetSpots,
  issueFine,
} = require('../controllers/technicienController');

// All technicien routes require technicien role
router.use(protect, authorize('technicien'));

// GET /api/technicien/streets
router.get('/streets', getStreets);

// GET /api/technicien/streets/:id/spots
router.get('/streets/:id/spots', getStreetSpots);

// POST /api/technicien/fines
router.post(
  '/fines',
  [
    body('streetParkingId').notEmpty().withMessage('Street parking ID is required'),
    body('carPlate').notEmpty().withMessage('Car plate is required'),
    body('reason').notEmpty().withMessage('Reason is required'),
  ],
  validate,
  issueFine
);

module.exports = router;
