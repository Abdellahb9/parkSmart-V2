const Booking = require('../models/Booking');
const Parking = require('../models/Parking');
const LoyaltyPoints = require('../models/LoyaltyPoints');

// POST /api/bookings — user only, atomic spot reservation
exports.create = async (req, res) => {
  try {
    const { parkingId, spotNumber, carPlate, startTime, endTime } = req.body;

    // Atomically reserve the spot only if it is currently available.
    // $elemMatch ensures both conditions match the SAME spot, so the
    // positional `$` below updates exactly that spot. This conditional
    // update is what prevents double-booking — no transaction needed
    // (and standalone MongoDB doesn't support them anyway).
    const parking = await Parking.findOneAndUpdate(
      {
        _id: parkingId,
        spots: { $elemMatch: { spotNumber, status: 'available' } },
      },
      {
        $set: { 'spots.$.status': 'reserved' },
      },
      { new: true }
    );

    if (!parking) {
      return res.status(400).json({ message: 'Spot is not available or parking not found' });
    }

    // Calculate hours and price
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const totalHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    const totalPrice = totalHours * parking.pricePerHour;

    let booking;
    try {
      booking = await Booking.create({
        userId: req.user._id,
        parkingId,
        spotNumber,
        carPlate,
        startTime: start,
        endTime: end,
        totalHours,
        totalPrice,
        status: 'active',
      });
    } catch (err) {
      // Roll back the spot reservation if creating the booking fails
      await Parking.updateOne(
        { _id: parkingId, 'spots.spotNumber': spotNumber },
        { $set: { 'spots.$.status': 'available' } }
      );
      throw err;
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/bookings/:id — booking detail
exports.getById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'fullName email phone')
      .populate('parkingId', 'name address pricePerHour');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/bookings/:id/cancel — cancellation with fee logic
exports.cancel = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled' || booking.status === 'done') {
      return res.status(400).json({ message: 'Booking already completed or cancelled' });
    }

    // 20% cancellation fee if booking is active
    let cancellationFee = 0;
    if (booking.status === 'active') {
      cancellationFee = Math.round(booking.totalPrice * 0.2 * 100) / 100;
    }

    booking.status = 'cancelled';
    booking.cancellationFee = cancellationFee;
    await booking.save();

    // Release the spot
    await Parking.findOneAndUpdate(
      { _id: booking.parkingId, 'spots.spotNumber': booking.spotNumber },
      { $set: { 'spots.$.status': 'available' } }
    );

    res.json({
      message: 'Booking cancelled',
      cancellationFee,
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/reservations — user's booking history
exports.getUserReservations = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('parkingId', 'name address pricePerHour')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/bookings/:id/complete — mark booking as done (called by system or owner)
exports.complete = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.status !== 'active') {
      return res.status(400).json({ message: 'Booking not found or not active' });
    }

    booking.status = 'done';
    await booking.save();

    // Release spot
    await Parking.findOneAndUpdate(
      { _id: booking.parkingId, 'spots.spotNumber': booking.spotNumber },
      { $set: { 'spots.$.status': 'available' } }
    );

    // Increment loyalty points
    await LoyaltyPoints.findOneAndUpdate(
      { userId: booking.userId, parkingId: booking.parkingId },
      { $inc: { bookingCount: 1 } },
      { upsert: true }
    );

    res.json({ message: 'Booking completed', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
