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
  // Opaque token rendered as a QR in the driver's app and checked at entry.
  qrToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  checkedInAt: {
    type: Date,
    default: null,
  },
  checkedOutAt: {
    type: Date,
    default: null,
  },
  // Audit trail for every extension, so a price change is explainable.
  extensions: [
    {
      from: Date,
      to: Date,
      at: { type: Date, default: Date.now },
      addedPrice: Number,
      _id: false,
    },
  ],
  // Defaults to 'unpaid' so every booking made before payments shipped, and
  // every client that still ignores them, keeps working unchanged.
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'refunded'],
    default: 'unpaid',
  },
  paidAt: {
    type: Date,
    default: null,
  },
  cancellationFee: {
    type: Number,
    default: 0,
  },
  // How the booking ended, for bookings closed by someone other than the
  // driver — in particular by the availability job. Optional and defaulted.
  endedBy: {
    type: String,
    enum: ['cancelled', 'completed', 'checked_out', 'expired', 'auto_closed', null],
    default: null,
  },
  // First moment a checked-in car was seen past its end time.
  overstayAt: {
    type: Date,
    default: null,
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
// The overlap check and the availability job both search by time window.
bookingSchema.index({ parkingId: 1, spotNumber: 1, status: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ status: 1, endTime: 1 });
bookingSchema.index({ status: 1, startTime: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
