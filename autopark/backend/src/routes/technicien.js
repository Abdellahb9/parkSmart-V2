const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const { finePhoto } = require('../middleware/finePhoto');
const {
  getStreets,
  getStreetSpots,
  issueFine,
  getFines,
  getFinePhoto,
} = require('../controllers/technicienController');

// All technicien routes require technicien role
router.use(protect, authorize('technicien'));

// GET /api/technicien/streets
router.get('/streets', getStreets);

// GET /api/technicien/streets/:id/spots
router.get('/streets/:id/spots', getStreetSpots);

// GET /api/technicien/fines — history of fines issued by this technician
router.get('/fines', getFines);

// GET /api/technicien/fines/:id/photo — evidence, from private storage
router.get('/fines/:id/photo', getFinePhoto);

// POST /api/technicien/fines — JSON, or multipart with an optional `photo`.
// The upload runs first so multipart text fields are in req.body by the time
// the validators read them.
router.post(
  '/fines',
  finePhoto,
  [
    body('streetParkingId').notEmpty().withMessage('Street parking ID is required'),
    body('carPlate').notEmpty().withMessage('Car plate is required'),
    body('reason').notEmpty().withMessage('Reason is required'),
  ],
  validate,
  issueFine
);

module.exports = router;
