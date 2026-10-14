/**
 * Sessions and account status (Phase 5b).
 *
 *  - writes isActive: true and tokenVersion: 0 on accounts created before
 *    those fields existed. The code already treats a missing value as
 *    "active, version 0", so this is for queries and the admin list (lean
 *    reads do not apply schema defaults), not for correctness;
 *  - creates the refresh-token collection's indexes, including the TTL index
 *    that deletes expired tokens.
 *
 * Existing tokens keep working: they carry no version, which reads as 0.
 *
 * Idempotent. Run with --dry to see what would change without writing.
 *
 *   node migrations/003-sessions-and-account-status.js --dry
 *   node migrations/003-sessions-and-account-status.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../src/models/User');
const RefreshToken = require('../src/models/RefreshToken');

const DRY = process.argv.includes('--dry');

const run = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autopark';
  await mongoose.connect(uri);
  console.log(`→ ${mongoose.connection.name} on ${mongoose.connection.host}${DRY ? ' (dry run)' : ''}\n`);

  const missingStatus = await User.countDocuments({ isActive: { $exists: false } });
  const missingVersion = await User.countDocuments({ tokenVersion: { $exists: false } });
  console.log(`  accounts without isActive:     ${missingStatus}`);
  console.log(`  accounts without tokenVersion: ${missingVersion}`);

  if (DRY) {
    console.log('\nNothing written (dry run).');
    return;
  }

  const status = await User.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } });
  const version = await User.updateMany({ tokenVersion: { $exists: false } }, { $set: { tokenVersion: 0 } });
  await RefreshToken.createIndexes();

  console.log(`\n  isActive written on     ${status.modifiedCount} account(s)`);
  console.log(`  tokenVersion written on ${version.modifiedCount} account(s)`);
  console.log('  refresh-token indexes   ready');
  console.log('\nDone.');
};

run()
  .catch((error) => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
