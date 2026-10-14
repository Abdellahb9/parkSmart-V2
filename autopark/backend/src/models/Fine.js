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
  // Which spot the fine was issued for. Optional so existing documents
  // stay valid; the mobile client now always sends it.
  spotNumber: {
    type: Number,
    default: null,
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
  // Server-side location of the photo evidence. Optional, so existing fines
  // stay valid; never sent to clients (see toJSON below).
  photoPath: {
    type: String,
    default: null,
  },
});

// Clients learn whether a photo exists, never where it is stored.
fineSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.hasPhoto = !!ret.photoPath;
    delete ret.photoPath;
    return ret;
  },
});

fineSchema.index({ streetParkingId: 1 });
fineSchema.index({ technicienId: 1 });

module.exports = mongoose.model('Fine', fineSchema);
