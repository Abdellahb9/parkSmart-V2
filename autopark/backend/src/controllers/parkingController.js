const Parking = require('../models/Parking');
const User = require('../models/User');

// GET /api/parkings — all parkings with availability
exports.getAll = async (req, res) => {
  try {
    const parkings = await Parking.find()
      .populate('ownerId', 'fullName email')
      .lean();

    const result = parkings.map(p => ({
      ...p,
      availableSpots: p.spots.filter(s => s.status === 'available').length,
      occupiedSpots: p.spots.filter(s => s.status !== 'available').length,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/parkings/:id — parking detail
exports.getById = async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.id)
      .populate('ownerId', 'fullName email phone')
      .lean();

    if (!parking) {
      return res.status(404).json({ message: 'Parking not found' });
    }

    parking.availableSpots = parking.spots.filter(s => s.status === 'available').length;
    parking.occupiedSpots = parking.spots.filter(s => s.status !== 'available').length;

    res.json(parking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/parkings/:id/spots — spots array for booking UI
exports.getSpots = async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.id).select('spots name pricePerHour pricePerDay').lean();
    if (!parking) {
      return res.status(404).json({ message: 'Parking not found' });
    }
    res.json(parking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/parkings — admin only, creates parking + auto-generates spots
exports.create = async (req, res) => {
  try {
    const { name, ownerId, type, latitude, longitude, address, totalSpots, pricePerHour, pricePerDay, commissionPercent } = req.body;

    // Verify owner exists and is a parking_owner
    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== 'parking_owner') {
      return res.status(400).json({ message: 'Invalid owner. Must be an existing parking_owner account.' });
    }

    const parking = await Parking.create({
      name,
      ownerId,
      type,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
      },
      address,
      totalSpots,
      pricePerHour,
      pricePerDay: pricePerDay || 0,
      commissionPercent: commissionPercent || 10,
    });

    await parking.populate('ownerId', 'fullName email');

    res.status(201).json(parking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/parkings/:id — admin only
exports.update = async (req, res) => {
  try {
    const allowedFields = ['name', 'pricePerHour', 'pricePerDay', 'commissionPercent', 'address'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const parking = await Parking.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('ownerId', 'fullName email');

    if (!parking) {
      return res.status(404).json({ message: 'Parking not found' });
    }

    res.json(parking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
