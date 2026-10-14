const Booking = require('../src/models/Booking');
const job = require('../src/jobs/availabilityJob');
const { RULES } = require('../src/services/availability');
const { resetDatabase, disconnect, seedNetwork, spotStatus, HOUR } = require('./helpers');

const MINUTE = 60 * 1000;
let net;

beforeAll(async () => {
  await resetDatabase();
  net = await seedNetwork();
});
afterAll(disconnect);

// Bookings are inserted directly with past times: the API rightly refuses
// to create them, but the job exists precisely to deal with them.
const insert = (fields) =>
  Booking.create({
    userId: net.users.ahmed._id,
    parkingId: net.parkings.massira._id,
    carPlate: 'JOB-TEST',
    totalHours: 1,
    totalPrice: 8,
    status: 'active',
    ...fields,
  });

describe('availability job', () => {
  test('an unchecked booking stays visible during the grace period', async () => {
    const recent = await insert({
      spotNumber: 1,
      startTime: new Date(Date.now() - 2 * HOUR),
      endTime: new Date(Date.now() - 10 * MINUTE),
    });
    await job.tick();
    expect((await Booking.findById(recent._id)).status).toBe('active');
  });

  test('an unchecked booking past the grace period is expired and its spot freed', async () => {
    const old = await insert({
      spotNumber: 2,
      startTime: new Date(Date.now() - 5 * HOUR),
      endTime: new Date(Date.now() - (RULES.uncheckedGraceMinutes + 5) * MINUTE),
    });
    const result = await job.tick();
    const after = await Booking.findById(old._id);
    expect(after.status).toBe('done');
    expect(after.endedBy).toBe('expired');
    expect(result.expired).toBeGreaterThanOrEqual(1);
    expect(await spotStatus(net.parkings.massira._id, 2)).toBe('available');
  });

  test('a checked-in car past its end is flagged as an overstay, once', async () => {
    const inside = await insert({
      spotNumber: 3,
      startTime: new Date(Date.now() - 3 * HOUR),
      endTime: new Date(Date.now() - 30 * MINUTE),
      checkedInAt: new Date(Date.now() - 3 * HOUR),
    });
    const first = await job.tick();
    const flagged = await Booking.findById(inside._id);
    expect(flagged.status).toBe('active');
    expect(flagged.overstayAt).toBeInstanceOf(Date);
    expect(first.overstays).toBeGreaterThanOrEqual(1);
    // The car is still inside: the spot stays occupied.
    await job.refreshAll();
    expect(await spotStatus(net.parkings.massira._id, 3)).toBe('occupied');

    const second = await job.tick();
    expect(second.overstays).toBe(0);
  });

  test('an overstay nobody checked out is auto-closed after the limit', async () => {
    const forgotten = await insert({
      spotNumber: 4,
      startTime: new Date(Date.now() - (RULES.autoCloseHours + 3) * HOUR),
      endTime: new Date(Date.now() - (RULES.autoCloseHours + 1) * HOUR),
      checkedInAt: new Date(Date.now() - (RULES.autoCloseHours + 3) * HOUR),
    });
    await job.tick();
    const after = await Booking.findById(forgotten._id);
    expect(after.status).toBe('done');
    expect(after.endedBy).toBe('auto_closed');
    expect(await spotStatus(net.parkings.massira._id, 4)).toBe('available');
  });

  test('a window that opens between ticks flips its spot to reserved', async () => {
    const since = new Date();
    await insert({
      spotNumber: 5,
      startTime: new Date(Date.now() + 200),
      endTime: new Date(Date.now() + HOUR),
    });
    expect(await spotStatus(net.parkings.massira._id, 5)).toBe('available');
    await new Promise((r) => setTimeout(r, 400));
    await job.tick({ now: new Date(), since });
    expect(await spotStatus(net.parkings.massira._id, 5)).toBe('reserved');
  });

  test('a window that closes between ticks frees its spot', async () => {
    const since = new Date();
    await insert({
      spotNumber: 6,
      startTime: new Date(Date.now() - HOUR),
      endTime: new Date(Date.now() + 200),
    });
    await job.refreshAll();
    expect(await spotStatus(net.parkings.massira._id, 6)).toBe('reserved');
    await new Promise((r) => setTimeout(r, 400));
    await job.tick({ now: new Date(), since });
    expect(await spotStatus(net.parkings.massira._id, 6)).toBe('available');
  });

  test('ticks are idempotent: a second run changes nothing', async () => {
    await job.tick();
    const again = await job.tick();
    expect(again).toMatchObject({ expired: 0, overstays: 0, autoClosed: 0 });
  });
});
