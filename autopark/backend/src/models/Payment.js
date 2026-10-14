const mongoose = require('mongoose');

/**
 * One money movement.
 *
 * Every charge, top-up and refund is a row here, so a booking's financial
 * history is reconstructible without reading the booking document. Amounts
 * are always positive; `kind` says which direction the money went.
 */
const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Null for wallet top-ups, which are not tied to a stay.
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
    index: true,
  },
  parkingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parking',
    default: null,
    index: true,
  },
  kind: {
    type: String,
    enum: ['booking', 'topup', 'refund'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'MAD',
  },
  method: {
    type: String,
    enum: ['wallet', 'card', 'cash'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true,
  },
  // Which adapter handled it, and its own identifier for the charge.
  provider: {
    type: String,
    default: 'mock',
  },
  providerRef: {
    type: String,
    default: '',
    index: true,
  },
  // Commission retained by AutoPark on a booking charge, in MAD. Stored at
  // payment time so a later change to the parking's rate cannot rewrite history.
  commission: {
    type: Number,
    default: 0,
  },
  failureReason: {
    type: String,
    default: '',
  },
  paidAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ parkingId: 1, status: 1, paidAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
