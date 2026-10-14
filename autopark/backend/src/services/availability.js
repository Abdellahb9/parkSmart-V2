const crypto = require('crypto');

const Booking = require('../models/Booking');
const Parking = require('../models/Parking');
const realtime = require('../realtime/emit');

/**
 * Time-aware availability.
 *
 * Bookings are the source of truth: a spot is taken for a window when an
 * active booking overlaps it. The per-spot `status` stored on the parking is
 * only a cache of "right now", recomputed by refresh() after every change and
 * by the availability job — so every existing reader keeps working.
 *
 * Standalone MongoDB has no transactions, so "check for an overlap, then
 * insert" is made atomic with a short per-spot lock held inside the parking
 * document (a single-document conditional update, which MongoDB does
 * guarantee). The lock expires on its own if the process dies holding it.
 */

const num = (name, fallback) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};

const RULES = {
  // Longest a booking may last, matching the existing extend rule.
  maxHours: 24,
  // A start slightly in the past is fine: the form was filled a moment ago.
  pastToleranceMinutes: num('BOOKING_PAST_TOLERANCE_MINUTES', 15),
  maxAdvanceDays: num('BOOKING_MAX_ADVANCE_DAYS', 30),
  // Drivers can be let in a little before their slot.
  earlyCheckInMinutes: num('EARLY_CHECKIN_MINUTES', 30),
  // An unchecked booking past its end stays visible as an overstay this long,
  // so a technician can still fine the car, then it is closed.
  uncheckedGraceMinutes: num('UNCHECKED_GRACE_MINUTES', 120),
  // A checked-in car nobody checked out is closed after this, so a forgotten
  // check-out cannot hold a spot forever.
  autoCloseHours: num('OVERSTAY_AUTOCLOSE_HOURS', 12),
  lockMs: num('SPOT_LOCK_MS', 10000),
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

class AvailabilityError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'AvailabilityError';
    this.status = status;
  }
}

/** Validates a requested window; returns an error message or null. */
const validateWindow = (start, end, now = new Date()) => {
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return 'Valid start time is required';
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return 'Valid end time is required';
  if (end <= start) return 'End time must be after start time';
  if (end - start > RULES.maxHours * HOUR) return 'A booking cannot exceed 24 hours';
  if (start < new Date(now.getTime() - RULES.pastToleranceMinutes * MINUTE)) {
    return 'Start time cannot be in the past';
  }
  if (start > new Date(now.getTime() + RULES.maxAdvanceDays * 24 * HOUR)) {
    return 'Bookings can be made at most 30 days ahead';
  }
  return null;
};

const billableHours = (start, end) => Math.max(1, Math.ceil((end - start) / HOUR));

/**
 * Active bookings that would clash with [start, end) on one spot.
 *
 * Two windows clash when they overlap. A car that is physically inside
 * (checked in, not checked out) also blocks any window that has already
 * begun, even past its booked end — nobody can park on top of it.
 */
const conflictFilter = (start, end, now = new Date()) => {
  const or = [{ startTime: { $lt: end }, endTime: { $gt: start } }];
  if (start < now) or.push({ checkedInAt: { $ne: null }, checkedOutAt: null, startTime: { $lt: end } });
  return { status: 'active', $or: or };
};

const findConflict = (parkingId, spotNumber, start, end, { excludeId } = {}) => {
  const query = { parkingId, spotNumber, ...conflictFilter(start, end) };
  if (excludeId) query._id = { $ne: excludeId };
  return Booking.findOne(query).select('_id startTime endTime').lean();
};

/** Active bookings holding a spot at one instant. */
const holdingFilter = (at) => ({
  status: 'active',
  $or: [
    { checkedInAt: { $ne: null }, checkedOutAt: null },
    { startTime: { $lte: at }, endTime: { $gt: at } },
  ],
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const acquireSpot = async (parkingId, spotNumber) => {
  const token = crypto.randomBytes(8).toString('hex');
  // ~40 tries with jitter ≈ 1.5 s worst case, far longer than any holder needs.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const now = new Date();
    const result = await Parking.updateOne(
      {
        _id: parkingId,
        spots: {
          $elemMatch: { spotNumber, $or: [{ lockUntil: null }, { lockUntil: { $lt: now } }] },
        },
      },
      {
        $set: {
          'spots.$.lockUntil': new Date(now.getTime() + RULES.lockMs),
          'spots.$.lockToken': token,
        },
      }
    );
    if (result.modifiedCount === 1) return token;
    await sleep(15 + Math.random() * 35);
  }
  return null;
};

// Only the holder may release: a lock that expired and was re-taken by
// someone else must not be freed by the original owner finishing late.
const releaseSpot = (parkingId, spotNumber, token) =>
  Parking.updateOne(
    { _id: parkingId, spots: { $elemMatch: { spotNumber, lockToken: token } } },
    { $set: { 'spots.$.lockUntil': null, 'spots.$.lockToken': null } }
  );

/** Runs fn while holding the spot's lock. */
const withSpotLock = async (parkingId, spotNumber, fn) => {
  const token = await acquireSpot(parkingId, spotNumber);
  if (!token) throw new AvailabilityError('This spot is busy, please try again', 409);
  try {
    return await fn();
  } finally {
    await releaseSpot(parkingId, spotNumber, token).catch(() => {});
  }
};

/**
 * Brings one parking's per-spot cache in line with its bookings right now and
 * broadcasts what changed. Cheap when nothing changed: one read each side.
 */
const refresh = async (parkingId, now = new Date()) => {
  if (!parkingId) return { changed: [] };
  const [parking, holding] = await Promise.all([
    Parking.findById(parkingId).select('spots.spotNumber spots.status').lean(),
    Booking.find({ parkingId, ...holdingFilter(now) }).select('spotNumber checkedInAt checkedOutAt').lean(),
  ]);
  if (!parking) return { changed: [] };

  const occupied = new Set();
  const reserved = new Set();
  for (const b of holding) {
    if (b.checkedInAt && !b.checkedOutAt) occupied.add(b.spotNumber);
    else reserved.add(b.spotNumber);
  }
  for (const n of occupied) reserved.delete(n);

  const wanted = (n) => (occupied.has(n) ? 'occupied' : reserved.has(n) ? 'reserved' : 'available');
  const changed = (parking.spots || [])
    .filter((s) => s.status !== wanted(s.spotNumber))
    .map((s) => ({ spotNumber: s.spotNumber, status: wanted(s.spotNumber) }));
  if (!changed.length) return { changed };

  // arrayFilters touch only `status`, so a lock taken meanwhile is preserved.
  await Parking.updateOne(
    { _id: parkingId },
    {
      $set: {
        'spots.$[o].status': 'occupied',
        'spots.$[r].status': 'reserved',
        'spots.$[a].status': 'available',
      },
    },
    {
      arrayFilters: [
        { 'o.spotNumber': { $in: [...occupied] } },
        { 'r.spotNumber': { $in: [...reserved] } },
        { 'a.spotNumber': { $nin: [...occupied, ...reserved] } },
      ],
    }
  );

  realtime.spotsChanged({ parkingId, changes: changed });
  return { changed };
};

/** Spot statuses for an arbitrary window — what a driver booking for tonight needs. */
const statusesForWindow = async (parkingId, spots, from, to) => {
  const bookings = await Booking.find({ parkingId, ...conflictFilter(from, to) })
    .select('spotNumber checkedInAt checkedOutAt')
    .lean();
  const taken = new Map();
  for (const b of bookings) {
    const inside = b.checkedInAt && !b.checkedOutAt;
    if (inside || !taken.has(b.spotNumber)) taken.set(b.spotNumber, inside ? 'occupied' : 'reserved');
  }
  return spots.map((s) => ({ spotNumber: s.spotNumber, status: taken.get(s.spotNumber) || 'available' }));
};

/** Only what clients may see of a spot — never the lock fields. */
const publicSpots = (spots = []) => spots.map(({ spotNumber, status }) => ({ spotNumber, status }));

module.exports = {
  RULES,
  AvailabilityError,
  validateWindow,
  billableHours,
  findConflict,
  conflictFilter,
  holdingFilter,
  withSpotLock,
  refresh,
  statusesForWindow,
  publicSpots,
};
