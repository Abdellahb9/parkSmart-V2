const router = require('express').Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const {
  getDashboard,
  getReservations,
  getComplaints,
} = require('../controllers/ownerController');
const { getOwnerRewards } = require('../controllers/rewardController');

// All owner routes require parking_owner role
router.use(protect, authorize('parking_owner'));

// GET /api/owner/dashboard
router.get('/dashboard', getDashboard);

// GET /api/owner/reservations
router.get('/reservations', getReservations);

// GET /api/owner/complaints
router.get('/complaints', getComplaints);

// GET /api/owner/rewards
router.get('/rewards', getOwnerRewards);

module.exports = router;
