const Parking = require('../models/Parking');
const User = require('../models/User');
const { managesParking } = require('../utils/ownership');
const { serverError } = require('../utils/http');
const availability = require('../services/availability');

// Decides what a given caller may see about a parking.
//
// Anonymous callers get the public listing only: no owner identity, no
// commission terms, and no per-spot occupancy map. Any signed-in caller also
// gets the owner's display name. The parking's own owner (and admins) get
// everything, which is what the admin portal renders.
const publicOwner = (owner) =>
  owner && typeof owner === 'object' ? { _id: owner._id, fullName: owner.fullName } : undefined;

const shapeParking = (parking, user) => {
  const { spots = [], ownerId, commissionPercent, ...rest } = parking;

  const shaped = {
    ...rest,
    availableSpots: spots.filter((s) => s.status === 'available').length,
    occupiedSpots: spots.filter((s) => s.status !== 'available').length,
  };

  if (!user) return shaped;

  if (managesParking({ ownerId }, user)) {
    return { ...shaped, ownerId, commissionPercent, spots: availability.publicSpots(spots) };
  }

  return { ...shaped, ownerId: publicOwner(ownerId) };
};

// GET /api/parkings — all parkings with availability
exports.getAll = async (req, res) => {
  try {
    const parkings = await Parking.find()
      .populate('ownerId', 'fullName email')
      .lean();

    res.json(parkings.map((p) => shapeParking(p, req.user)));
  } catch (error) {
    serverError(res, error);
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

    res.json(shapeParking(parking, req.user));
  } catch (error) {
    serverError(res, error);
  }
};

// GET /api/parkings/:id/spots — spots for the booking UI.
//
// Without parameters: what each spot is doing right now (unchanged shape).
// With ?from=&to=: whether each spot is free for that window — what a driver
// booking for tonight actually needs to see.
exports.getSpots = async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.id).select('spots name pricePerHour pricePerDay').lean();
    if (!parking) {
      return res.status(404).json({ message: 'Parking not found' });
    }

    const { from, to } = req.query;
    if (from || to) {
      const start = new Date(from);
      const end = new Date(to);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }
      const spots = await availability.statusesForWindow(parking._id, parking.spots || [], start, end);
      return res.json({ ...parking, spots, window: { from: start, to: end } });
    }

    res.json({ ...parking, spots: availability.publicSpots(parking.spots) });
  } catch (error) {
    serverError(res, error);
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
    serverError(res, error);
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
    serverError(res, error);
  }
};

// GET /api/parkings/near?lat=&lng=&radius= — parkings around a point, closest
// first, with the distance in metres. Uses the 2dsphere index that has existed
// since the first version and was never queried.
exports.getNear = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'Valid latitude and longitude are required' });
    }
    // Default 2 km, at most 20 km: a driver looks for parking nearby, not city-wide.
    const radius = Math.min(Math.max(Number(req.query.radius) || 2000, 50), 20000);

    const parkings = await Parking.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          maxDistance: radius,
          spherical: true,
        },
      },
      { $limit: 50 },
    ]);
    await Parking.populate(parkings, { path: 'ownerId', select: 'fullName email' });

    res.json(
      parkings.map((p) => ({
        ...shapeParking(p, req.user),
        distanceMeters: Math.round(p.distanceMeters),
      }))
    );
  } catch (error) {
    serverError(res, error);
  }
};
