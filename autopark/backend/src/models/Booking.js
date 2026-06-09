const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  spotNumber: {
    type: Number,
    required: [true, 'Spot number is required'],
  },
  carPlate: {
    type: String,
    required: [true, 'Car plate is required'],
    trim: true,
    uppercase: true,
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
  },
  totalHours: {
    type: Number,
    required: true,
    min: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'done', 'cancelled'],
    default: 'pending',
  },
  cancellationFee: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for quick lookups
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ parkingId: 1, status: 1 });
bookingSchema.index({ parkingId: 1, spotNumber: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
