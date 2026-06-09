const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const {
  getUsers,
  createUser,
  getAllReservations,
  getStats,
} = require('../controllers/adminController');
const { getAll: getAllComplaints } = require('../controllers/complaintController');

// All admin routes require admin role
router.use(protect, authorize('admin'));

// GET /api/admin/users
router.get('/users', getUsers);

// POST /api/admin/users — create parking_owner or technicien
router.post(
  '/users',
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['parking_owner', 'technicien']).withMessage('Role must be parking_owner or technicien'),
  ],
  validate,
  createUser
);

// GET /api/admin/reservations
router.get('/reservations', getAllReservations);

// GET /api/admin/complaints
router.get('/complaints', getAllComplaints);

// GET /api/admin/stats
router.get('/stats', getStats);

module.exports = router;
