const Parking = require('../models/Parking');
const Booking = require('../models/Booking');
const Fine = require('../models/Fine');

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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/technicien/streets/:id/spots — spots + active reservations
exports.getStreetSpots = async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.id).lean();
    if (!parking || parking.type !== 'open_street') {
      return res.status(404).json({ message: 'Open street parking not found' });
    }

    // Get active bookings for this parking
    const activeBookings = await Booking.find({
      parkingId: parking._id,
      status: 'active',
    }).select('spotNumber carPlate startTime endTime userId').lean();

    // Map bookings by spot number
    const bookingBySpot = {};
    activeBookings.forEach(b => {
      bookingBySpot[b.spotNumber] = b;
    });

    // Enrich spots with booking info
    const enrichedSpots = parking.spots.map(spot => ({
      spotNumber: spot.spotNumber,
      status: spot.status,
      booking: bookingBySpot[spot.spotNumber] || null,
    }));

    res.json({
      _id: parking._id,
      name: parking.name,
      address: parking.address,
      spots: enrichedSpots,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/technicien/fines — issue a fine
exports.issueFine = async (req, res) => {
  try {
    const { streetParkingId, carPlate, reason } = req.body;

    // Verify it's an open_street parking
    const parking = await Parking.findById(streetParkingId);
    if (!parking || parking.type !== 'open_street') {
      return res.status(400).json({ message: 'Must be an open street parking' });
    }

    const fine = await Fine.create({
      technicienId: req.user._id,
      streetParkingId,
      carPlate,
      reason,
    });

    res.status(201).json(fine);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
