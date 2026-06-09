const mongoose = require('mongoose');

const loyaltyPointsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parkingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parking',
    required: true,
  },
  bookingCount: {
    type: Number,
    default: 0,
    min: 0,
  },
});

// Compound unique index: one entry per user per parking
loyaltyPointsSchema.index({ userId: 1, parkingId: 1 }, { unique: true });

module.exports = mongoose.model('LoyaltyPoints', loyaltyPointsSchema);
