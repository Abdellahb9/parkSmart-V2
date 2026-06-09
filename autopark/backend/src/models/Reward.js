const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Reward title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  parkingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parking',
    default: null, // null = global reward
  },
  requiredBookings: {
    type: Number,
    required: [true, 'Required bookings count is required'],
    min: 1,
  },
  type: {
    type: String,
    enum: ['free_wash', 'discount_coupon', 'free_vidange', 'free_reservation'],
    required: true,
  },
});

module.exports = mongoose.model('Reward', rewardSchema);
