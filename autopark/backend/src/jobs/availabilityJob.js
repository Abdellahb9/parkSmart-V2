const Booking = require('../models/Booking');
const Parking = require('../models/Parking');
const realtime = require('../realtime/emit');
const availability = require('../services/availability');
const baseLogger = require('../utils/logger');

/**
 * Keeps availability honest as time passes.
 *
 * Before this job nothing ever freed a spot: a booking whose end time passed
 * simply kept the spot until someone remembered to close it, so capacity
 * decayed towards zero. Each tick:
 *
 *  1. closes unchecked bookings that ended more than the grace period ago
 *     (no-shows, or street parkers who left) — endedBy 'expired';
 *  2. flags checked-in cars that are past their end (overstay) and tells the
 *     driver, the owner and admins;
 *  3. closes overstays nobody checked out after OVERSTAY_AUTOCLOSE_HOURS —
 *     endedBy 'auto_closed';
 *  4. refreshes the live spot cache wherever a booked window opened or closed.
 *
 * Every write is conditional on `status: 'active'`, so running two instances
 * of the API — or a tick overlapping a staff check-out — is harmless.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const tick = async ({ now = new Date(), since = new Date(now.getTime() - 2 * MINUTE) } = {}) => {
  const { RULES } = availability;
  const touched = new Set();

  // 1. Expire unchecked bookings past their grace period.
  const expireBefore = new Date(now.getTime() - RULES.uncheckedGraceMinutes * MINUTE);
  const expiring = await Booking.find({ status: 'active', checkedInAt: null, endTime: { $lt: expireBefore } })
    .select('_id userId parkingId spotNumber')
    .lean();
  if (expiring.length) {
    await Booking.updateMany(
      { _id: { $in: expiring.map((b) => b._id) }, status: 'active', checkedInAt: null },
      { $set: { status: 'done', endedBy: 'expired' } }
    );
    for (const b of expiring) {
      touched.add(String(b.parkingId));
      realtime.spotReleased({ booking: b, reason: 'expired' });
    }
  }

  // 2. Flag new overstays (checked in, still inside, past the end).
  const overstaying = await Booking.find({
    status: 'active',
    checkedInAt: { $ne: null },
    checkedOutAt: null,
    endTime: { $lt: now },
    overstayAt: null,
  })
    .select('_id userId parkingId spotNumber endTime')
    .lean();
  if (overstaying.length) {
    await Booking.updateMany(
      { _id: { $in: overstaying.map((b) => b._id) }, overstayAt: null },
      { $set: { overstayAt: now } }
    );
    const owners = new Map(
      (
        await Parking.find({ _id: { $in: [...new Set(overstaying.map((b) => String(b.parkingId)))] } })
          .select('ownerId')
          .lean()
      ).map((p) => [String(p._id), p.ownerId])
    );
    for (const b of overstaying) realtime.bookingOverstay({ booking: b, ownerId: owners.get(String(b.parkingId)) });
  }

  // 3. Auto-close overstays nobody checked out.
  const closeBefore = new Date(now.getTime() - RULES.autoCloseHours * HOUR);
  const stale = await Booking.find({
    status: 'active',
    checkedInAt: { $ne: null },
    checkedOutAt: null,
    endTime: { $lt: closeBefore },
  })
    .select('_id userId parkingId spotNumber')
    .lean();
  if (stale.length) {
    await Booking.updateMany(
      { _id: { $in: stale.map((b) => b._id) }, status: 'active' },
      { $set: { status: 'done', endedBy: 'auto_closed' } }
    );
    for (const b of stale) {
      touched.add(String(b.parkingId));
      realtime.spotReleased({ booking: b, reason: 'auto_closed' });
    }
  }

  // 4. Windows that opened or closed since the last tick change the live cache.
  const crossed = await Booking.distinct('parkingId', {
    status: 'active',
    $or: [{ startTime: { $gt: since, $lte: now } }, { endTime: { $gt: since, $lte: now } }],
  });
  for (const id of crossed) touched.add(String(id));

  let spotsChanged = 0;
  for (const parkingId of touched) {
    const { changed } = await availability.refresh(parkingId, now);
    spotsChanged += changed.length;
  }

  return {
    expired: expiring.length,
    overstays: overstaying.length,
    autoClosed: stale.length,
    parkingsRefreshed: touched.size,
    spotsChanged,
  };
};

/** Recomputes every parking's live cache — at boot, and from the migration. */
const refreshAll = async (now = new Date()) => {
  const ids = await Parking.distinct('_id');
  let spotsChanged = 0;
  for (const id of ids) spotsChanged += (await availability.refresh(id, now)).changed.length;
  return { parkings: ids.length, spotsChanged };
};

let timer = null;

/** Starts the job; returns a stop function. Not started by app.js, so tests drive tick() directly. */
const start = ({ intervalMs = 60 * 1000, logger = baseLogger.child({ module: 'availability' }) } = {}) => {
  if (timer) return () => {};
  let running = false;
  let last = new Date();

  const run = async () => {
    if (running) return; // a slow tick must not overlap the next one
    running = true;
    const now = new Date();
    try {
      const result = await tick({ now, since: last });
      last = now;
      if (result.expired || result.overstays || result.autoClosed || result.spotsChanged) {
        logger.info(result, 'availability tick');
      }
    } catch (error) {
      logger.error({ err: error }, 'availability tick failed');
    } finally {
      running = false;
    }
  };

  // Catch up on anything that changed while the server was down, then tick.
  refreshAll()
    .then(() => run())
    .catch((error) => logger.error({ err: error }, 'availability initial refresh failed'));

  timer = setInterval(run, intervalMs);
  timer.unref?.();
  return () => {
    clearInterval(timer);
    timer = null;
  };
};

module.exports = { tick, refreshAll, start };
