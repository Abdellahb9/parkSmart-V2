const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const {
  getWallet,
  listMine,
  topUp,
  payBooking,
  confirm,
  list,
  collectCash,
} = require('../controllers/paymentController');

// Every payment route needs an identified caller.
router.use(protect);

const objectId = (name) => param(name).isMongoId().withMessage('Invalid id');

router.get('/wallet', getWallet);
router.get('/my', listMine);

router.post(
  '/topup',
  [body('amount').isFloat({ gt: 0, max: 5000 }).withMessage('Amount must be between 0 and 5000')],
  validate,
  topUp
);

router.post(
  '/booking/:bookingId',
  [
    objectId('bookingId'),
    body('method').optional().isIn(['wallet', 'card', 'cash']).withMessage('Unsupported method'),
  ],
  validate,
  payBooking
);

router.post('/:id/confirm', [objectId('id')], validate, confirm);

// Staff-side.
router.get('/', authorize('admin', 'parking_owner'), list);
router.post(
  '/:id/collect',
  authorize('admin', 'parking_owner'),
  [objectId('id')],
  validate,
  collectCash
);

module.exports = router;
