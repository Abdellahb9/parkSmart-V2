const router = require('express').Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const { revenue } = require('../controllers/reportController');

// Figures are scoped inside the controller: an owner only ever sees their own
// parkings, an admin sees the whole network.
router.use(protect, authorize('admin', 'parking_owner'));

router.get('/revenue', revenue);

module.exports = router;
