/**
 * Switches availability to time-aware bookings.
 *
 *  - creates the new indexes (time-window lookups, owner/type filters);
 *  - closes the backlog the old model accumulated: bookings whose end passed
 *    long ago but were never closed (nothing used to close them) and
 *    checked-in overstays nobody checked out;
 *  - recomputes every spot's live status from the bookings that hold it now,
 *    so spots held by stale bookings come back.
 *
 * New fields (endedBy, overstayAt, spot lock fields) are optional with
 * defaults; nothing needs backfilling for the apps to work.
 *
 * Idempotent. Run with --dry to see what would change without writing.
 *
 *   node migrations/002-time-aware-availability.js --dry
 *   node migrations/002-time-aware-availability.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const Booking = require('../src/models/Booking');
const Parking = require('../src/models/Parking');
const availability = require('../src/services/availability');
const job = require('../src/jobs/availabilityJob');

const DRY = process.argv.includes('--dry');
const MINUTE = 60 * 1000;

const run = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autopark';
  await mongoose.connect(uri);
  console.log(`→ ${mongoose.connection.name} on ${mongoose.connection.host}${DRY ? ' (dry run)' : ''}\n`);

  const now = new Date();
  const { RULES } = availability;

  if (DRY) {
    const expirable = await Booking.countDocuments({
      status: 'active',
      checkedInAt: null,
      endTime: { $lt: new Date(now - RULES.uncheckedGraceMinutes * MINUTE) },
    });
    const overstays = await Booking.countDocuments({
      status: 'active',
      checkedInAt: { $ne: null },
      checkedOutAt: null,
      endTime: { $lt: now },
      overstayAt: null,
    });
    const autoClose = await Booking.countDocuments({
      status: 'active',
      checkedInAt: { $ne: null },
      checkedOutAt: null,
      endTime: { $lt: new Date(now - RULES.autoCloseHours * 60 * MINUTE) },
    });

    // Spots whose stored status disagrees with the bookings holding them now.
    let outOfSync = 0;
    for (const parking of await Parking.find().select('spots').lean()) {
      const holding = await Booking.find({ parkingId: parking._id, ...availability.holdingFilter(now) })
        .select('spotNumber checkedInAt checkedOutAt')
        .lean();
      const state = new Map();
      for (const b of holding) {
        const inside = b.checkedInAt && !b.checkedOutAt;
        if (inside || !state.has(b.spotNumber)) state.set(b.spotNumber, inside ? 'occupied' : 'reserved');
      }
      for (const s of parking.spots) if ((state.get(s.spotNumber) || 'available') !== s.status) outOfSync += 1;
    }

    console.log(`  would expire          ${String(expirable).padStart(5)}  unchecked bookings past their grace period`);
    console.log(`  would flag            ${String(overstays).padStart(5)}  checked-in overstays`);
    console.log(`  would auto-close      ${String(autoClose).padStart(5)}  overstays older than ${RULES.autoCloseHours} h`);
    console.log(`  would resync          ${String(outOfSync).padStart(5)}  spots whose status is stale (before the closures above)`);
    console.log('\nDry run complete.');
  } else {
    await Booking.createIndexes();
    await Parking.createIndexes();
    console.log('  indexes               ensured');

    // since=epoch: treat every window as "crossed" so all parkings refresh.
    const result = await job.tick({ now, since: new Date(0) });
    const all = await job.refreshAll(now);
    console.log(`  expired               ${String(result.expired).padStart(5)}  unchecked bookings past their grace period`);
    console.log(`  flagged               ${String(result.overstays).padStart(5)}  checked-in overstays`);
    console.log(`  auto-closed           ${String(result.autoClosed).padStart(5)}  overstays older than ${RULES.autoCloseHours} h`);
    console.log(`  resynced              ${String(result.spotsChanged + all.spotsChanged).padStart(5)}  spots across ${all.parkings} parkings`);
    console.log('\nMigration complete.');
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Migration failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
