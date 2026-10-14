const crypto = require('crypto');
const Booking = require('../models/Booking');
const Parking = require('../models/Parking');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const { ownsBooking, managesParking } = require('../utils/ownership');
const { serverError } = require('../utils/http');
const logger = require('../utils/logger');
const { paginate } = require('../utils/paginate');
const realtime = require('../realtime/emit');
const availability = require('../services/availability');
const { refundForCancellation } = require('./paymentController');

const MINUTE = 60 * 1000;

// POST /api/bookings — user only.
//
// Time-aware: a spot is free for a window when no active booking overlaps it,
// so two drivers can book the same spot for 10:00–12:00 and 14:00–16:00, and a
// booking for tonight no longer blocks the spot this morning. The overlap
// check and the insert run under the spot's lock, which is what makes double
// booking impossible without transactions.
exports.create = async (req, res) => {
  try {
    const { parkingId, carPlate } = req.body;
    const spotNumber = Number(req.body.spotNumber);
    const start = new Date(req.body.startTime);
    const end = new Date(req.body.endTime);

    const invalid = availability.validateWindow(start, end);
    if (invalid) return res.status(400).json({ message: invalid });

    // The spot must exist. Same message as before for a missing parking/spot.
    const parking = await Parking.findOne(
      { _id: parkingId, 'spots.spotNumber': spotNumber },
      { pricePerHour: 1, ownerId: 1, type: 1 }
    ).lean();
    if (!parking) {
      return res.status(400).json({ message: 'Spot is not available or parking not found' });
    }

    const totalHours = availability.billableHours(start, end);
    const totalPrice = totalHours * parking.pricePerHour;

    const booking = await availability.withSpotLock(parking._id, spotNumber, async () => {
      const conflict = await availability.findConflict(parking._id, spotNumber, start, end);
      if (conflict) {
        throw new availability.AvailabilityError('This spot is already booked for that time', 400);
      }
      return Booking.create({
        userId: req.user._id,
        parkingId: parking._id,
        spotNumber,
        carPlate,
        startTime: start,
        endTime: end,
        totalHours,
        totalPrice,
        status: 'active',
        qrToken: crypto.randomBytes(18).toString('base64url'),
      });
    });

    realtime.bookingCreated({ booking, parking });
    // Flips the spot to 'reserved' only if the window has already begun.
    await availability.refresh(parking._id);

    res.status(201).json(booking);
  } catch (error) {
    serverError(res, error);
  }
};

// GET /api/bookings/:id — booking detail
// Visible to the driver who booked it, the owner of that parking, or an admin.
exports.getById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'fullName email phone')
      .populate('parkingId', 'name address pricePerHour');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    let authorized = ownsBooking(booking, req.user);

    // Owners may read bookings in their own parkings. Looked up separately so
    // the response payload stays exactly as it was for existing clients.
    if (!authorized && req.user.role === 'parking_owner') {
      const parking = await Parking.findById(booking.parkingId).select('ownerId').lean();
      authorized = managesParking(parking, req.user);
    }

    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    serverError(res, error);
  }
};

// PATCH /api/bookings/:id/cancel — cancellation with fee logic
// Only the driver who made the booking (or an admin) may cancel it.
exports.cancel = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!ownsBooking(booking, req.user)) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
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
    booking.endedBy = 'cancelled';
    booking.cancellationFee = cancellationFee;

    // Give the money back, minus the fee, when the stay was already paid.
    // A no-op on an unpaid booking, which is every booking made before
    // payments existed.
    let refund = null;
    try {
      refund = await refundForCancellation(booking, { fee: cancellationFee });
    } catch (err) {
      // A failed refund must not block the cancellation — the spot has to be
      // freed either way. It is logged for an operator to settle by hand.
      (req.log || logger).error({ err, bookingId: String(booking._id) }, 'refund failed; settle by hand');
    }

    await booking.save();

    realtime.spotReleased({ booking, reason: 'cancelled' });
    await availability.refresh(booking.parkingId);

    res.json({
      message: 'Booking cancelled',
      cancellationFee,
      refund,
      booking,
    });
  } catch (error) {
    serverError(res, error);
  }
};

// GET /api/reservations — user's booking history
exports.getUserReservations = async (req, res) => {
  try {
    const bookings = await paginate(req, res, Booking, { userId: req.user._id }, (q) =>
      q.populate('parkingId', 'name address pricePerHour').sort({ createdAt: -1 })
    );

    res.json(bookings);
  } catch (error) {
    serverError(res, error);
  }
};

// Counts a stay towards loyalty exactly once, whichever path closed it.
const creditLoyalty = (booking) =>
  LoyaltyPoints.findOneAndUpdate(
    { userId: booking.userId, parkingId: booking.parkingId },
    { $inc: { bookingCount: 1 } },
    { upsert: true }
  );

/**
 * Closes an active booking atomically. Returns the updated booking, or null if
 * it was no longer active — so two staff members closing the same booking at
 * once cannot both credit loyalty points.
 */
const closeActive = (bookingId, fields) =>
  Booking.findOneAndUpdate({ _id: bookingId, status: 'active' }, { $set: { status: 'done', ...fields } }, { new: true });

// PATCH /api/bookings/:id/complete — mark booking as done
// Only an admin, or the owner of the parking the booking belongs to.
exports.complete = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(400).json({ message: 'Booking not found or not active' });
    }

    // Authorization is checked before state so an unauthorized caller cannot
    // probe whether a given booking exists or is still active.
    const parking = await Parking.findById(booking.parkingId).select('ownerId').lean();
    if (!managesParking(parking, req.user)) {
      return res.status(403).json({ message: 'Not authorized to complete this booking' });
    }

    const closed = await closeActive(booking._id, { endedBy: 'completed' });
    if (!closed) {
      return res.status(400).json({ message: 'Booking not found or not active' });
    }

    await creditLoyalty(closed);
    realtime.spotReleased({ booking: closed, reason: 'completed' });
    await availability.refresh(closed.parkingId);

    res.json({ message: 'Booking completed', booking: closed });
  } catch (error) {
    serverError(res, error);
  }
};

// Who may validate entry on a given parking: an admin, the parking's owner,
// or a technician when it is public-street parking.
const canValidate = (parking, user) =>
  managesParking(parking, user) || (user.role === 'technicien' && parking && parking.type === 'open_street');

// PATCH /api/bookings/:id/extend — push an active booking's end time back.
// The extra time must be free: extending into the next driver's slot is
// refused, under the same lock as a new booking.
exports.extend = async (req, res) => {
  try {
    const { newEndTime } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!ownsBooking(booking, req.user)) {
      return res.status(403).json({ message: 'Not authorized to extend this booking' });
    }
    if (booking.status !== 'active') {
      return res.status(400).json({ message: 'Only an active booking can be extended' });
    }

    const newEnd = new Date(newEndTime);
    if (Number.isNaN(newEnd.getTime())) {
      return res.status(400).json({ message: 'Invalid end time' });
    }
    if (newEnd <= booking.endTime) {
      return res.status(400).json({ message: 'The new end time must be later than the current one' });
    }

    const parking = await Parking.findById(booking.parkingId).select('pricePerHour ownerId type');
    if (!parking) return res.status(404).json({ message: 'Parking not found' });

    const totalHours = availability.billableHours(booking.startTime, newEnd);
    if (totalHours > availability.RULES.maxHours) {
      return res.status(400).json({ message: 'A booking cannot exceed 24 hours' });
    }

    const newPrice = totalHours * parking.pricePerHour;
    const addedPrice = Math.round((newPrice - booking.totalPrice) * 100) / 100;

    await availability.withSpotLock(booking.parkingId, booking.spotNumber, async () => {
      const conflict = await availability.findConflict(
        booking.parkingId,
        booking.spotNumber,
        booking.endTime,
        newEnd,
        { excludeId: booking._id }
      );
      if (conflict) {
        throw new availability.AvailabilityError('The spot is booked by someone else after your slot', 400);
      }
      booking.extensions.push({ from: booking.endTime, to: newEnd, at: new Date(), addedPrice });
      booking.endTime = newEnd;
      booking.totalHours = totalHours;
      booking.totalPrice = newPrice;
      // Back inside its window: no longer an overstay.
      booking.overstayAt = null;
      await booking.save();
    });

    realtime.bookingExtended({ booking, addedPrice });
    await availability.refresh(booking.parkingId);

    res.json({ message: 'Booking extended', addedPrice, booking });
  } catch (error) {
    serverError(res, error);
  }
};

// POST /api/bookings/:id/check-in — validate arrival against the QR token
exports.checkIn = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    return await performCheckIn(booking, req.body.qrToken, req, res);
  } catch (error) {
    serverError(res, error);
  }
};

// POST /api/bookings/check-in — validate an entry from the QR token alone.
//
// What a scanner (or a code typed from the driver's screen) actually has: no
// booking id, just the token. The token is a 144-bit random value under a
// unique index, so looking a booking up by it is both safe and fast.
exports.checkInByToken = async (req, res) => {
  try {
    const qrToken = typeof req.body.qrToken === 'string' ? req.body.qrToken.trim() : '';
    if (!qrToken) return res.status(400).json({ message: 'QR code is required' });
    const booking = await Booking.findOne({ qrToken });
    if (!booking) return res.status(404).json({ message: 'Unknown QR code' });
    return await performCheckIn(booking, qrToken, req, res);
  } catch (error) {
    serverError(res, error);
  }
};

const performCheckIn = async (booking, qrToken, req, res) => {
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  const parking = await Parking.findById(booking.parkingId).select('ownerId type name');
  if (!canValidate(parking, req.user)) {
    return res.status(403).json({ message: 'Not authorized to validate this booking' });
  }
  // The token proves the driver presented this booking, rather than someone
  // guessing an id.
  if (!qrToken || !booking.qrToken || qrToken !== booking.qrToken) {
    return res.status(403).json({ message: 'Invalid QR code for this booking' });
  }
  if (booking.status !== 'active') {
    return res.status(410).json({ message: 'This booking is no longer active' });
  }
  if (booking.checkedInAt) {
    return res.status(409).json({ message: 'This booking is already checked in' });
  }

  // Bookings are time-bound now: a car arriving for tonight's slot this
  // morning would be parking on someone else's booking.
  const now = new Date();
  if (now < new Date(booking.startTime.getTime() - availability.RULES.earlyCheckInMinutes * MINUTE)) {
    return res.status(400).json({ message: 'Too early: this booking has not started yet' });
  }
  if (now > booking.endTime) {
    return res.status(410).json({ message: 'This booking has ended' });
  }

  // Atomic: two staff scanning the same car at once get one success, one 409.
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: 'active', checkedInAt: null },
    { $set: { checkedInAt: now } },
    { new: true }
  );
  if (!updated) return res.status(409).json({ message: 'This booking is already checked in' });

  realtime.spotStateChanged({ booking: updated, status: 'occupied' });
  // 'occupied' finally means something: the car is physically there.
  await availability.refresh(updated.parkingId);

  // parkingName is additive: the scanner shows where the car belongs.
  return res.json({ message: 'Checked in', booking: updated, parkingName: parking.name });
};

// POST /api/bookings/:id/check-out — record departure and free the spot
exports.checkOut = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const parking = await Parking.findById(booking.parkingId).select('ownerId type');
    if (!canValidate(parking, req.user)) {
      return res.status(403).json({ message: 'Not authorized to validate this booking' });
    }

    const closed = await closeActive(booking._id, { endedBy: 'checked_out', checkedOutAt: new Date() });
    if (!closed) {
      return res.status(410).json({ message: 'This booking is no longer active' });
    }

    await creditLoyalty(closed);
    realtime.spotReleased({ booking: closed, reason: 'checked_out' });
    await availability.refresh(closed.parkingId);

    res.json({ message: 'Checked out', booking: closed });
  } catch (error) {
    serverError(res, error);
  }
};
