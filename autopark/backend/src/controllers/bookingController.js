const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Parking = require('../models/Parking');
const LoyaltyPoints = require('../models/LoyaltyPoints');

// POST /api/bookings — user only, atomic spot reservation
exports.create = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { parkingId, spotNumber, carPlate, startTime, endTime } = req.body;

    // Find parking and check spot availability atomically
    const parking = await Parking.findOneAndUpdate(
      {
        _id: parkingId,
        'spots.spotNumber': spotNumber,
        'spots.status': 'available',
      },
      {
        $set: { 'spots.$.status': 'reserved' },
      },
      { new: true, session }
    );

    if (!parking) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Spot is not available or parking not found' });
    }

    // Calculate hours and price
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const totalHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    const totalPrice = totalHours * parking.pricePerHour;

    const booking = await Booking.create([{
      userId: req.user._id,
      parkingId,
      spotNumber,
      carPlate,
      startTime: start,
      endTime: end,
      totalHours,
      totalPrice,
      status: 'active',
    }], { session });

    await session.commitTransaction();

    res.status(201).json(booking[0]);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(req.params.id).session(session);

    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled' || booking.status === 'done') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Booking already completed or cancelled' });
    }

    // 20% cancellation fee if booking is active
    let cancellationFee = 0;
    if (booking.status === 'active') {
      cancellationFee = Math.round(booking.totalPrice * 0.2 * 100) / 100;
    }

    booking.status = 'cancelled';
    booking.cancellationFee = cancellationFee;
    await booking.save({ session });

    // Release the spot
    await Parking.findOneAndUpdate(
      { _id: booking.parkingId, 'spots.spotNumber': booking.spotNumber },
      { $set: { 'spots.$.status': 'available' } },
      { session }
    );

    await session.commitTransaction();

    res.json({
      message: 'Booking cancelled',
      cancellationFee,
      booking,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking || booking.status !== 'active') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Booking not found or not active' });
    }

    booking.status = 'done';
    await booking.save({ session });

    // Release spot
    await Parking.findOneAndUpdate(
      { _id: booking.parkingId, 'spots.spotNumber': booking.spotNumber },
      { $set: { 'spots.$.status': 'available' } },
      { session }
    );

    // Increment loyalty points
    await LoyaltyPoints.findOneAndUpdate(
      { userId: booking.userId, parkingId: booking.parkingId },
      { $inc: { bookingCount: 1 } },
      { upsert: true, session }
    );

    await session.commitTransaction();

    res.json({ message: 'Booking completed', booking });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};
