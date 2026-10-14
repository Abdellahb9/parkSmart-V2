/**
 * Builds a realistic Laâyoune network for demos and local development.
 *
 *   npm run seed
 *
 * WIPES every collection first. Refuses to run with NODE_ENV=production
 * unless SEED_ALLOW_PRODUCTION=1 is set explicitly.
 *
 * What it creates:
 *  - 1 admin, 3 parking owners, 2 technicians, 12 drivers;
 *  - 13 parkings (8 private car parks, 5 public streets) placed in their
 *    neighbourhoods;
 *  - 60 days of bookings shaped by the hour of day and the day of the week,
 *    with no two bookings ever overlapping on a spot;
 *  - payments that add up: wallet top-ups before wallet payments, card
 *    declines, cash collected at the exit, refunds on cancellation, and the
 *    owner's commission on each;
 *  - loyalty points counted from the stays themselves;
 *  - what is happening right now: cars inside, spots held for arrivals,
 *    bookings for tonight and tomorrow, and one overstay;
 *  - complaints in drivers' own words and technicians' fines.
 *
 * The random generator is seeded, so every run builds the same network
 * (relative to the current date). Set SEED_RANDOM to get a different one.
 */
require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('./src/models/User');
const Parking = require('./src/models/Parking');
const Booking = require('./src/models/Booking');
const Complaint = require('./src/models/Complaint');
const LoyaltyPoints = require('./src/models/LoyaltyPoints');
const Reward = require('./src/models/Reward');
const Payment = require('./src/models/Payment');
const Fine = require('./src/models/Fine');
const RefreshToken = require('./src/models/RefreshToken');
const availabilityJob = require('./src/jobs/availabilityJob');
const data = require('./seed/laayoune');

// Demo passwords for LOCAL DEVELOPMENT ONLY. Override per environment with
// SEED_ADMIN_PASSWORD / SEED_OWNER_PASSWORD / SEED_TECH_PASSWORD / SEED_USER_PASSWORD
// so a deployed instance never ships with publicly known credentials.
const PASSWORDS = {
  admin: process.env.SEED_ADMIN_PASSWORD || 'admin123',
  owner: process.env.SEED_OWNER_PASSWORD || 'owner123',
  tech: process.env.SEED_TECH_PASSWORD || 'tech123',
  user: process.env.SEED_USER_PASSWORD || 'user123',
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const HISTORY_DAYS = 60;

// ── Seeded randomness ──────────────────────────────────────────────────
const mulberry32 = (seed) => () => {
  /* eslint-disable no-bitwise */
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  /* eslint-enable no-bitwise */
};
const rand = mulberry32(Number(process.env.SEED_RANDOM) || 20261014);
const between = (a, b) => a + rand() * (b - a);
const int = (a, b) => Math.floor(between(a, b + 1));
const pick = (list) => list[Math.floor(rand() * list.length)];
const chance = (p) => rand() < p;
const weighted = (pairs) => {
  const total = pairs.reduce((sum, [, w]) => sum + w, 0);
  let r = rand() * total;
  for (const [value, w] of pairs) {
    r -= w;
    if (r <= 0) return value;
  }
  return pairs[pairs.length - 1][0];
};
const round2 = (n) => Math.round(n * 100) / 100;
const roundTo = (date, minutes) => new Date(Math.round(date.getTime() / (minutes * MINUTE)) * minutes * MINUTE);
const qr = () => crypto.randomBytes(18).toString('base64url');
const providerRef = () => `mock_${crypto.randomBytes(9).toString('hex')}`;

// When people arrive: a morning peak, a quiet lunch, an evening peak.
const ARRIVAL_HOURS = [
  [7, 3], [8, 7], [9, 10], [10, 10], [11, 9], [12, 6], [13, 5], [14, 6],
  [15, 7], [16, 9], [17, 10], [18, 9], [19, 7], [20, 4], [21, 2],
];
// Sunday is quiet, Friday afternoon too.
const DAY_FACTOR = [0.6, 1, 1, 1, 1, 0.8, 0.9];

// Enough drivers that nobody needs to hold two spots at once.
const COMMUNITY_SIZE = 160;
const deaccent = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '');

const community = () => {
  const used = new Set(data.DRIVERS.map((d) => d.email));
  const list = [];
  while (list.length < COMMUNITY_SIZE) {
    const first = pick(data.NAMES.first);
    const last = pick(data.NAMES.last);
    const base = deaccent(`${first}.${last}`).toLowerCase().replace(/[^a-z.]+/g, '');
    let email = `${base}@autopark.ma`;
    for (let n = 2; used.has(email); n += 1) email = `${base}${n}@autopark.ma`;
    used.add(email);
    list.push({
      key: `driver${list.length + 1}`,
      fullName: `${first} ${last}`,
      email,
      phone: `+2126${int(10000000, 99999999)}`,
      weight: 1,
      plate: `${int(10000, 99999)}-${pick(['A', 'B', 'D', 'H', 'W'])}-61`,
    });
  }
  return list;
};

const run = async () => {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== '1') {
    throw new Error('Refusing to wipe a production database. Set SEED_ALLOW_PRODUCTION=1 if you really mean it.');
  }
  if (process.env.NODE_ENV === 'production') {
    // The local defaults are public; a production seed must choose its own.
    const missing = ['SEED_ADMIN_PASSWORD', 'SEED_OWNER_PASSWORD', 'SEED_TECH_PASSWORD', 'SEED_USER_PASSWORD'].filter(
      (name) => !process.env[name]
    );
    if (missing.length) throw new Error(`Set ${missing.join(', ')} before seeding a production database.`);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ Connected to ${mongoose.connection.name}`);

  await Promise.all(
    [User, Parking, Booking, Complaint, LoyaltyPoints, Reward, Payment, Fine, RefreshToken].map((m) => m.deleteMany({}))
  );
  console.log('🗑️  Cleared existing data');

  // ── Accounts ──────────────────────────────────────────────────────────
  const drivers = [...data.DRIVERS, ...community()];
  // One bcrypt hash per role password instead of one per account; insertMany
  // skips the save hook, so these are stored as given.
  const hashed = Object.fromEntries(
    await Promise.all(Object.entries(PASSWORDS).map(async ([role, pw]) => [role, await bcrypt.hash(pw, 12)]))
  );
  const accounts = [
    { key: 'admin', fullName: 'Admin AutoPark', email: 'admin@autopark.ma', phone: '+212600000001', CNE: 'ADM001', role: 'admin', password: hashed.admin },
    ...data.OWNERS.map((o) => ({ ...o, role: 'parking_owner', password: hashed.owner })),
    ...data.TECHNICIANS.map((t) => ({ ...t, role: 'technicien', password: hashed.tech })),
    ...drivers.map((d) => ({ ...d, role: 'user', password: hashed.user })),
  ].map((a, i) => ({
    ...a,
    // Staff accounts first, then drivers signing up over the past months.
    createdAt: new Date(Date.now() - (HISTORY_DAYS + 90 - i * 4) * 24 * HOUR),
  }));
  const users = await User.insertMany(accounts.map(({ key, weight, plate, ...doc }) => doc));
  const user = Object.fromEntries(accounts.map((a, i) => [a.key, users[i]]));
  console.log(`👤 ${users.length} accounts`);

  // ── Parkings ──────────────────────────────────────────────────────────
  const parkings = [];
  for (const p of data.PARKINGS) {
    const doc = await Parking.create({
      name: p.name,
      ownerId: user[p.owner]._id,
      type: p.type,
      location: { type: 'Point', coordinates: p.coordinates },
      address: p.address,
      totalSpots: p.totalSpots,
      pricePerHour: p.pricePerHour,
      pricePerDay: p.pricePerDay,
      commissionPercent: p.commissionPercent,
    });
    parkings.push({ ...p, doc });
  }
  const parking = Object.fromEntries(parkings.map((p) => [p.key, p]));
  console.log(`🅿️  ${parkings.length} parkings`);

  // ── Shared state for the generator ───────────────────────────────────
  const now = new Date();
  const bookings = [];
  const payments = [];
  const wallet = Object.fromEntries(drivers.map((d) => [d.key, 0]));
  const loyalty = new Map();
  const visits = new Map(); // parking key -> driver keys, for plausible complaints
  const timeline = new Map(); // "parking:spot" -> [[start, end]]

  const driverPool = drivers.map((d) => [d, d.weight]);

  const spotIsFree = (p, spot, start, end) =>
    !(timeline.get(`${p.key}:${spot}`) || []).some(([s, e]) => s < end && e > start);
  const claimSpot = (p, start, end, preferred) => {
    const order = preferred ? [preferred] : [];
    for (let i = 0; i < 10; i += 1) order.push(int(1, p.totalSpots));
    const spot = order.find((n) => spotIsFree(p, n, start, end));
    if (!spot) return null;
    const key = `${p.key}:${spot}`;
    timeline.set(key, [...(timeline.get(key) || []), [start, end]]);
    return spot;
  };

  const topUpIfNeeded = (driver, amount, at) => {
    while (wallet[driver.key] < amount) {
      const value = pick([100, 150, 200, 300]);
      const when = new Date(at.getTime() - int(5, 90) * MINUTE);
      payments.push({
        userId: user[driver.key]._id,
        kind: 'topup',
        amount: value,
        method: 'card',
        status: 'paid',
        provider: 'mock',
        providerRef: providerRef(),
        paidAt: when,
        createdAt: when,
      });
      wallet[driver.key] += value;
    }
  };

  /** Records a payment for a booking and updates it to match. */
  const pay = (b, p, driver, method, at, { pending = false } = {}) => {
    const amount = round2(b.totalPrice);
    const base = {
      userId: user[driver.key]._id,
      bookingId: b._id,
      parkingId: p.doc._id,
      kind: 'booking',
      amount,
      commission: round2((amount * p.commissionPercent) / 100),
      method,
      createdAt: at,
    };
    if (method === 'cash' && pending) {
      payments.push({ ...base, status: 'pending', provider: 'cash' });
      b.paymentStatus = 'pending';
      return;
    }
    if (method === 'wallet') {
      topUpIfNeeded(driver, amount, at);
      wallet[driver.key] = round2(wallet[driver.key] - amount);
    }
    if (method === 'card' && chance(0.06)) {
      // A declined first attempt, retried successfully a minute later.
      payments.push({
        ...base,
        status: 'failed',
        provider: 'mock',
        providerRef: providerRef(),
        failureReason: 'Paiement refusé par la banque',
      });
    }
    payments.push({
      ...base,
      status: 'paid',
      provider: method === 'card' ? 'mock' : method,
      providerRef: method === 'card' ? providerRef() : '',
      paidAt: at,
    });
    b.paymentStatus = 'paid';
    b.paidAt = at;
  };

  const newBooking = (p, driver, spot, start, end, extra = {}) => {
    const hours = Math.max(1, Math.ceil((end - start) / HOUR));
    const b = {
      _id: new mongoose.Types.ObjectId(),
      userId: user[driver.key]._id,
      parkingId: p.doc._id,
      spotNumber: spot,
      carPlate: driver.plate,
      startTime: start,
      endTime: end,
      totalHours: hours,
      totalPrice: hours * p.pricePerHour,
      status: 'active',
      qrToken: qr(),
      paymentStatus: 'unpaid',
      createdAt: new Date(Math.min(now.getTime(), start.getTime() - int(10, 36 * 60) * MINUTE)),
      ...extra,
    };
    bookings.push(b);
    if (!visits.has(p.key)) visits.set(p.key, new Set());
    visits.get(p.key).add(driver.key);
    return b;
  };

  const creditLoyalty = (driver, p) => {
    const key = `${driver.key}:${p.key}`;
    loyalty.set(key, (loyalty.get(key) || 0) + 1);
  };

  // ── 60 days of history ───────────────────────────────────────────────
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let daysAgo = HISTORY_DAYS; daysAgo >= 0; daysAgo -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - daysAgo);
    const factor = DAY_FACTOR[day.getDay()];

    for (const p of parkings) {
      const count = Math.round(p.totalSpots * p.demand * factor * between(0.75, 1.25));
      for (let i = 0; i < count; i += 1) {
        const start = new Date(day);
        start.setHours(weighted(ARRIVAL_HOURS), pick([0, 15, 30, 45]), 0, 0);
        const end = new Date(start.getTime() + weighted(p.hours) * HOUR);
        if (end > now) continue; // anything still running belongs to "right now" below
        const spot = claimSpot(p, start, end);
        if (!spot) continue;

        const driver = weighted(driverPool);
        const b = newBooking(p, driver, spot, start, end);
        const roll = rand();

        if (roll < 0.05) {
          // Cancelled ahead of time; prepaid ones were refunded minus the fee.
          b.status = 'cancelled';
          b.endedBy = 'cancelled';
          b.cancellationFee = round2(b.totalPrice * 0.2);
          if (chance(0.5)) {
            pay(b, p, driver, chance(0.6) ? 'wallet' : 'card', b.createdAt);
            const refundAt = new Date(Math.min(start.getTime() - 20 * MINUTE, b.createdAt.getTime() + 3 * HOUR));
            const refund = round2(b.totalPrice - b.cancellationFee);
            payments[payments.length - 1].status = 'refunded';
            payments.push({
              userId: user[driver.key]._id,
              bookingId: b._id,
              parkingId: p.doc._id,
              kind: 'refund',
              amount: refund,
              method: 'wallet',
              status: 'paid',
              provider: 'wallet',
              paidAt: refundAt,
              createdAt: refundAt,
            });
            wallet[driver.key] = round2(wallet[driver.key] + refund);
            b.paymentStatus = 'refunded';
          }
        } else if (roll < 0.09) {
          // A no-show the availability job expired after the grace period.
          b.status = 'done';
          b.endedBy = 'expired';
          if (chance(0.3)) pay(b, p, driver, 'wallet', b.createdAt);
        } else {
          b.status = 'done';
          b.checkedInAt = new Date(start.getTime() + int(0, 12) * MINUTE);
          if (chance(0.88)) {
            b.endedBy = 'checked_out';
            const overrun = chance(0.12) ? int(5, 40) : -int(0, 20);
            b.checkedOutAt = new Date(end.getTime() + overrun * MINUTE);
          } else {
            b.endedBy = 'completed'; // closed by staff from the portal
          }
          creditLoyalty(driver, p);

          const method = weighted([['wallet', 40], ['card', 22], ['cash', 24], [null, 14]]);
          if (method === 'cash') pay(b, p, driver, 'cash', b.checkedOutAt || end);
          else if (method) pay(b, p, driver, method, b.createdAt);
        }
      }
    }
  }

  // ── Right now ────────────────────────────────────────────────────────
  // The demo drivers first, so their screens show every state.
  const live = (p, driver, start, end, { checkedIn = true, method = null, overstay = false } = {}) => {
    const spot = claimSpot(p, start, end);
    if (!spot) return null;
    const b = newBooking(p, driver, spot, start, end);
    if (checkedIn) b.checkedInAt = new Date(start.getTime() + int(2, 8) * MINUTE);
    if (overstay) b.overstayAt = new Date(end.getTime() + MINUTE);
    if (method === 'cash') pay(b, p, driver, 'cash', b.createdAt, { pending: true });
    else if (method) pay(b, p, driver, method, b.createdAt);
    return b;
  };
  const at = (hoursFromNow) => roundTo(new Date(now.getTime() + hoursFromNow * HOUR), 5);
  const tomorrowAt = (hour) => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const ahmed = drivers.find((d) => d.key === 'ahmed');
  const fatima = drivers.find((d) => d.key === 'fatima');

  // One car per driver: nobody is inside two car parks at once, or holds
  // more than one upcoming booking. The demo drivers' states are set above.
  const busyNow = new Set(['ahmed', 'fatima']);
  const busyLater = new Set(['ahmed', 'fatima']);
  const freeDriver = (busy) => {
    for (let i = 0; i < 60; i += 1) {
      const d = weighted(driverPool);
      if (!busy.has(d.key)) {
        busy.add(d.key);
        return d;
      }
    }
    return null;
  };

  live(parking.massira, ahmed, at(-0.85), at(1.15), { method: 'wallet' }); // inside, paid
  live(parking.dchira, ahmed, tomorrowAt(10), tomorrowAt(12), { checkedIn: false }); // tomorrow, unpaid
  live(parking.centre, fatima, at(-2.7), at(-0.6), { method: 'card', overstay: true }); // overstaying
  live(parking.souk, fatima, tomorrowAt(18), tomorrowAt(19), { checkedIn: false, method: 'wallet' });

  for (const p of parkings) {
    const inside = Math.round(p.totalSpots * between(0.3, 0.6) * Math.min(1.2, p.demand + 0.4));
    for (let i = 0; i < inside; i += 1) {
      const start = at(-between(0.2, 2.5));
      let end = new Date(start.getTime() + weighted(p.hours) * HOUR);
      if (end <= at(0.2)) end = new Date(start.getTime() + Math.ceil((at(0.5) - start) / HOUR) * HOUR);
      const driver = freeDriver(busyNow);
      if (!driver) break;
      live(p, driver, start, end, {
        // A few have just arrived and are held, not yet scanned in.
        checkedIn: chance(0.8),
        method: weighted([['wallet', 35], ['card', 20], ['cash', 20], [null, 25]]),
      });
    }
    const later = Math.round(p.totalSpots * between(0.1, 0.3));
    for (let i = 0; i < later; i += 1) {
      const start = roundTo(new Date(now.getTime() + between(0.75, 30) * HOUR), 15);
      const end = new Date(start.getTime() + weighted(p.hours) * HOUR);
      const driver = freeDriver(busyLater);
      if (!driver) break;
      live(p, driver, start, end, { checkedIn: false, method: chance(0.4) ? 'wallet' : null });
    }
  }

  for (let i = 0; i < bookings.length; i += 2000) {
    await Booking.insertMany(bookings.slice(i, i + 2000));
  }
  for (let i = 0; i < payments.length; i += 2000) {
    await Payment.insertMany(payments.slice(i, i + 2000));
  }
  console.log(`📋 ${bookings.length} bookings, 💳 ${payments.length} payments`);

  // Wallets end where their ledger says they do.
  await User.bulkWrite(
    drivers.map((d) => ({
      updateOne: { filter: { _id: user[d.key]._id }, update: { $set: { walletBalance: round2(wallet[d.key]) } } },
    }))
  );

  // ── Loyalty, rewards ─────────────────────────────────────────────────
  await LoyaltyPoints.insertMany(
    [...loyalty.entries()].map(([key, bookingCount]) => {
      const [driverKey, parkingKey] = key.split(':');
      return { userId: user[driverKey]._id, parkingId: parking[parkingKey].doc._id, bookingCount };
    })
  );
  await Reward.insertMany(
    data.REWARDS.map(({ parking: key, ...r }) => ({ ...r, parkingId: key ? parking[key].doc._id : null }))
  );
  console.log(`⭐ ${loyalty.size} loyalty balances, 🎁 ${data.REWARDS.length} rewards`);

  // ── Complaints and fines ─────────────────────────────────────────────
  const complaints = data.COMPLAINTS.map(([key, message, resolved]) => {
    const regulars = [...(visits.get(key) || [])];
    const driverKey = regulars.length ? pick(regulars) : 'ahmed';
    return {
      userId: user[driverKey]._id,
      parkingId: parking[key].doc._id,
      message,
      status: resolved ? 'resolved' : 'open',
      createdAt: new Date(now.getTime() - between(0.5, 40) * 24 * HOUR),
    };
  });
  await Complaint.insertMany(complaints);

  const streets = parkings.filter((p) => p.type === 'open_street');
  const letters = ['A', 'B', 'D', 'H', 'W'];
  const fines = Array.from({ length: 36 }, () => {
    const p = pick(streets);
    const issuedAt = new Date(today.getTime() - int(0, 45) * 24 * HOUR);
    issuedAt.setHours(int(8, 20), int(0, 59), 0, 0);
    return {
      technicienId: user[pick(['tech1', 'tech1', 'tech2'])]._id,
      streetParkingId: p.doc._id,
      spotNumber: int(1, p.totalSpots),
      carPlate: `${int(10000, 99999)}-${pick(letters)}-${pick([61, 61, 61, 6, 1, 26, 40])}`,
      reason: pick(data.FINE_REASONS),
      issuedAt: issuedAt > now ? new Date(now.getTime() - HOUR) : issuedAt,
    };
  });
  await Fine.insertMany(fines);
  console.log(`📝 ${complaints.length} complaints, 🚨 ${fines.length} fines`);

  // ── Live spot colours, computed exactly as the API does ──────────────
  await availabilityJob.refreshAll(now);

  const since = new Date(now.getTime() - 30 * 24 * HOUR);
  const [revenue] = await Payment.aggregate([
    { $match: { kind: 'booking', status: { $in: ['paid', 'refunded'] }, paidAt: { $gte: since } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const live_ = await Parking.aggregate([
    { $unwind: '$spots' },
    { $group: { _id: '$spots.status', n: { $sum: 1 } } },
  ]);
  const occupancy = Object.fromEntries(live_.map((r) => [r._id, r.n]));

  console.log('\n✅ Seed completed');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`  Collected over the last 30 days: ${Math.round(revenue?.total || 0).toLocaleString('fr-FR')} MAD`);
  console.log(`  Spots right now: ${occupancy.occupied || 0} occupied, ${occupancy.reserved || 0} held, ${occupancy.available || 0} free`);
  console.log('─────────────────────────────────────────────────────────');
  console.log('Accounts (passwords come from the SEED_*_PASSWORD env vars,');
  console.log('or the local dev defaults in seed.js — never reuse them in production):');
  console.log('  Admin:       admin@autopark.ma');
  console.log('  Owners:      owner1@autopark.ma, owner2@autopark.ma, owner3@autopark.ma');
  console.log('  Technicians: tech1@autopark.ma, tech2@autopark.ma');
  console.log(`  Drivers:     ahmed@autopark.ma, fatima@autopark.ma (+${drivers.length - 2} more)`);
  console.log('─────────────────────────────────────────────────────────');
};

run()
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error('❌ Seed error:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  });
