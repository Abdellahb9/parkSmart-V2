const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
  technicienId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  streetParkingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parking',
    required: true,
  },
  carPlate: {
    type: String,
    required: [true, 'Car plate is required'],
    trim: true,
    uppercase: true,
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
});

fineSchema.index({ streetParkingId: 1 });
fineSchema.index({ technicienId: 1 });

module.exports = mongoose.model('Fine', fineSchema);
