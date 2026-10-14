const Parking = require('../models/Parking');
const Booking = require('../models/Booking');
const Fine = require('../models/Fine');
const availability = require('../services/availability');
const path = require('path');
const { discardUpload, FINE_PHOTO_DIR } = require('../middleware/finePhoto');
const { serverError } = require('../utils/http');
const { paginate } = require('../utils/paginate');

// GET /api/technicien/streets — open_street parkings list
exports.getStreets = async (req, res) => {
  try {
    const streets = await Parking.find({ type: 'open_street' })
      .select('name address totalSpots spots location')
      .lean();

    const result = streets.map(s => ({
      ...s,
      availableSpots: s.spots.filter(sp => sp.status === 'available').length,
      occupiedSpots: s.spots.filter(sp => sp.status !== 'available').length,
    }));

    res.json(result);
  } catch (error) {
    serverError(res, error);
  }
};

// GET /api/technicien/streets/:id/spots — spots + active reservations
exports.getStreetSpots = async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.id).lean();
    if (!parking || parking.type !== 'open_street') {
      return res.status(404).json({ message: 'Open street parking not found' });
    }

    // What a technician on the pavement needs per spot: the booking that
    // concerns it right now. Since bookings are time-aware a spot can have a
    // booking for tonight as well — that one is irrelevant here. A booking
    // that has just ended but was never closed is kept (shown as an overstay)
    // during the grace period, so the car can still be fined.
    const now = new Date();
    const graceStart = new Date(now.getTime() - availability.RULES.uncheckedGraceMinutes * 60 * 1000);
    const relevant = await Booking.find({
      parkingId: parking._id,
      status: 'active',
      startTime: { $lte: now },
      $or: [{ endTime: { $gt: graceStart } }, { checkedInAt: { $ne: null }, checkedOutAt: null }],
    })
      .select('spotNumber carPlate startTime endTime userId checkedInAt')
      .sort({ startTime: -1 })
      .lean();

    // Prefer the booking whose window covers now over one that just ended.
    const bookingBySpot = {};
    for (const b of relevant) {
      const current = bookingBySpot[b.spotNumber];
      const coversNow = b.endTime > now;
      if (!current || (coversNow && current.endTime <= now)) bookingBySpot[b.spotNumber] = b;
    }

    const enrichedSpots = parking.spots.map((spot) => {
      const booking = bookingBySpot[spot.spotNumber] || null;
      let status = 'available';
      if (booking) status = booking.checkedInAt || booking.endTime <= now ? 'occupied' : 'reserved';
      return { spotNumber: spot.spotNumber, status, booking };
    });

    res.json({
      _id: parking._id,
      name: parking.name,
      address: parking.address,
      spots: enrichedSpots,
    });
  } catch (error) {
    serverError(res, error);
  }
};

// POST /api/technicien/fines — issue a fine
exports.issueFine = async (req, res) => {
  try {
    const { streetParkingId, carPlate, reason, spotNumber } = req.body;

    // Verify it's an open_street parking
    const parking = await Parking.findById(streetParkingId);
    if (!parking || parking.type !== 'open_street') {
      discardUpload(req.file);
      return res.status(400).json({ message: 'Must be an open street parking' });
    }

    const fine = await Fine.create({
      technicienId: req.user._id,
      streetParkingId,
      carPlate,
      reason,
      // Multipart sends every field as text; '' must not become spot 0.
      spotNumber: spotNumber != null && spotNumber !== '' ? Number(spotNumber) : null,
      // Only the basename: the directory is a server concern.
      photoPath: req.file ? path.basename(req.file.path) : null,
    });

    res.status(201).json(fine);
  } catch (error) {
    discardUpload(req.file);
    serverError(res, error);
  }
};

// GET /api/technicien/fines — fines issued by the signed-in technician
exports.getFines = async (req, res) => {
  try {
    const fines = await paginate(req, res, Fine, { technicienId: req.user._id }, (q) =>
      q.populate('streetParkingId', 'name').sort({ issuedAt: -1 }).lean()
    );

    // lean() skips the schema's toJSON, so the path is stripped here too.
    res.json(fines.map(({ photoPath, ...fine }) => ({ ...fine, hasPhoto: !!photoPath })));
  } catch (error) {
    serverError(res, error);
  }
};

// GET /api/technicien/fines/:id/photo — the evidence photo, for the
// technician who issued the fine. Streams from private storage.
exports.getFinePhoto = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id).select('technicienId photoPath').lean();
    if (!fine || !fine.photoPath) return res.status(404).json({ message: 'Photo not found' });
    if (String(fine.technicienId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this photo' });
    }

    // basename() again on the way out, in case a stored value was ever tampered with.
    const file = path.join(FINE_PHOTO_DIR, path.basename(fine.photoPath));
    res.set('Cache-Control', 'private, max-age=3600');
    return res.sendFile(file, (err) => {
      if (err && !res.headersSent) res.status(404).json({ message: 'Photo not found' });
    });
  } catch (error) {
    return serverError(res, error);
  }
};
