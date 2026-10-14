/**
 * Backfills the fields added in Phase 4 (booking lifecycle + payments).
 *
 * Every one of them is optional with a default, so the apps already work
 * without this script. It exists for two reasons: Mongoose only applies a
 * default when a document is written, so documents on disk keep reading as
 * `undefined` until touched — and an existing active booking has no qrToken,
 * which means nobody can check it in.
 *
 * Idempotent: each step only matches documents that still lack the field.
 *
 *   node migrations/001-booking-lifecycle-and-payments.js
 *   node migrations/001-booking-lifecycle-and-payments.js --dry
 */
require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');

const Booking = require('../src/models/Booking');
const User = require('../src/models/User');

const DRY = process.argv.includes('--dry');

const run = async () => {
  // Same variable as src/config/db.js, so the script always targets the
  // database the API is actually using.
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autopark';
  await mongoose.connect(uri);
  console.log(`→ ${mongoose.connection.name} on ${mongoose.connection.host}${DRY ? ' (dry run)' : ''}`);

  const steps = [];

  // 1. Booking lifecycle fields (Phase 4a).
  const lifecycleFilter = {
    $or: [{ checkedInAt: { $exists: false } }, { checkedOutAt: { $exists: false } }],
  };
  const lifecycleCount = await Booking.countDocuments(lifecycleFilter);
  steps.push(['bookings · checkedInAt/checkedOutAt', lifecycleCount]);
  if (!DRY && lifecycleCount) {
    await Booking.updateMany(lifecycleFilter, {
      $set: { checkedInAt: null, checkedOutAt: null },
    });
  }

  // 2. Payment fields (Phase 4b).
  const payFilter = { paymentStatus: { $exists: false } };
  const payCount = await Booking.countDocuments(payFilter);
  steps.push(['bookings · paymentStatus/paidAt', payCount]);
  if (!DRY && payCount) {
    await Booking.updateMany(payFilter, { $set: { paymentStatus: 'unpaid', paidAt: null } });
  }

  // 3. Wallet balance.
  const walletFilter = { walletBalance: { $exists: false } };
  const walletCount = await User.countDocuments(walletFilter);
  steps.push(['users · walletBalance', walletCount]);
  if (!DRY && walletCount) {
    await User.updateMany(walletFilter, { $set: { walletBalance: 0 } });
  }

  // 4. QR tokens for bookings that can still be checked in. Written one at a
  //    time because each needs its own random value, and the index is unique.
  const needsToken = await Booking.find({
    status: { $in: ['pending', 'active'] },
    $or: [{ qrToken: { $exists: false } }, { qrToken: null }, { qrToken: '' }],
  })
    .select('_id')
    .lean();
  steps.push(['bookings · qrToken', needsToken.length]);
  if (!DRY) {
    for (const { _id } of needsToken) {
      await Booking.updateOne(
        { _id },
        { $set: { qrToken: crypto.randomBytes(18).toString('base64url') } }
      );
    }
  }

  console.log('');
  for (const [label, count] of steps) {
    console.log(`  ${DRY ? 'would update' : 'updated'} ${String(count).padStart(5)}  ${label}`);
  }
  console.log(`\n${DRY ? 'Dry run complete.' : 'Migration complete.'}`);

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Migration failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
