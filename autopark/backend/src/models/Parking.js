const mongoose = require('mongoose');

const spotSchema = new mongoose.Schema({
  spotNumber: { type: Number, required: true },
  // What the spot is doing RIGHT NOW. Since bookings became time-aware this is
  // a cache derived from them (services/availability.js), kept so every
  // existing reader — map counts, occupancy gauges — stays correct unchanged.
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved'],
    default: 'available',
  },
  // Short-lived mutex taken while a booking for this spot is being written,
  // so two overlapping reservations cannot both pass the overlap check.
  // Expires on its own if the server dies holding it. Never sent to clients.
  lockUntil: { type: Date, default: null },
  lockToken: { type: String, default: null },
}, { _id: false });

const parkingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Parking name is required'],
    trim: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
  },
  type: {
    type: String,
    enum: ['normal', 'open_street'],
    default: 'normal',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  totalSpots: {
    type: Number,
    required: [true, 'Total spots is required'],
    min: 1,
  },
  pricePerHour: {
    type: Number,
    required: [true, 'Price per hour is required'],
    min: 0,
  },
  pricePerDay: {
    type: Number,
    default: 0,
    min: 0,
  },
  commissionPercent: {
    type: Number,
    default: 10,
    min: 0,
    max: 100,
  },
  spots: [spotSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 2dsphere index for geospatial queries
parkingSchema.index({ location: '2dsphere' });
parkingSchema.index({ ownerId: 1 });
parkingSchema.index({ type: 1 });

// Auto-generate spots array when creating a new parking
parkingSchema.pre('save', function (next) {
  if (this.isNew && this.spots.length === 0) {
    const spotsArray = [];
    for (let i = 1; i <= this.totalSpots; i++) {
      spotsArray.push({ spotNumber: i, status: 'available' });
    }
    this.spots = spotsArray;
  }
  next();
});

module.exports = mongoose.model('Parking', parkingSchema);
