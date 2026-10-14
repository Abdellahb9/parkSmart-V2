const Booking = require('../src/models/Booking');
const { api, auth, book, window, resetDatabase, disconnect, seedNetwork, spotStatus, HOUR } = require('./helpers');

let net;
// Every window is relative to this one instant, so back-to-back boundaries
// line up to the millisecond instead of drifting with each Date.now().
const T0 = Date.now() + 60 * 1000;
const w = (from, to) => window(from, to, T0);
beforeAll(async () => {
  await resetDatabase();
  net = await seedNetwork();
});
afterAll(disconnect);

describe('time-aware booking', () => {
  test('a booking for later does not block the spot now', async () => {
    const res = await book(net.tokens.ahmed, net.parkings.massira, 1, w(3, 5));
    expect(res.status).toBe(201);
    expect(await spotStatus(net.parkings.massira._id, 1)).toBe('available');
  });

  test('a booking covering now reserves the spot immediately', async () => {
    const res = await book(net.tokens.ahmed, net.parkings.massira, 2, window(-0.1, 2));
    expect(res.status).toBe(201);
    expect(await spotStatus(net.parkings.massira._id, 2)).toBe('reserved');
  });

  test('an overlapping window on the same spot is refused', async () => {
    const res = await book(net.tokens.fatima, net.parkings.massira, 1, w(4, 6));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('This spot is already booked for that time');
  });

  test('back-to-back windows on the same spot are both accepted', async () => {
    expect((await book(net.tokens.fatima, net.parkings.massira, 1, w(5, 7))).status).toBe(201);
    expect((await book(net.tokens.fatima, net.parkings.massira, 1, w(1, 3))).status).toBe(201);
  });

  test('the same window on another spot is fine', async () => {
    expect((await book(net.tokens.fatima, net.parkings.massira, 3, w(3, 5))).status).toBe(201);
  });

  test('?from=&to= reports availability for that window', async () => {
    const { startTime, endTime } = w(3.5, 4.5);
    const res = await api()
      .get(`/api/parkings/${net.parkings.massira._id}/spots`)
      .query({ from: startTime, to: endTime })
      .set(auth(net.tokens.ahmed));
    expect(res.status).toBe(200);
    const status = Object.fromEntries(res.body.spots.map((s) => [s.spotNumber, s.status]));
    expect(status[1]).toBe('reserved'); // 3–5 booking
    expect(status[3]).toBe('reserved');
    expect(status[4]).toBe('available');
    // Lock internals never leak.
    expect(res.body.spots.every((s) => !('lockUntil' in s) && !('lockToken' in s))).toBe(true);
  });

  test('without parameters the spots endpoint keeps its old shape', async () => {
    const res = await api().get(`/api/parkings/${net.parkings.massira._id}/spots`).set(auth(net.tokens.ahmed));
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Parking Al Massira');
    expect(res.body.spots).toHaveLength(6);
    expect(Object.keys(res.body.spots[0]).sort()).toEqual(['spotNumber', 'status']);
  });
});

describe('window validation', () => {
  const cases = [
    ['end before start', window(3, 2), 'End time must be after start time'],
    ['longer than 24 h', window(1, 26), 'A booking cannot exceed 24 hours'],
    ['starting in the past', window(-2, 1), 'Start time cannot be in the past'],
    ['more than 30 days ahead', window(24 * 31, 24 * 31 + 1), 'Bookings can be made at most 30 days ahead'],
  ];
  test.each(cases)('refuses a booking %s', async (_name, win, message) => {
    const res = await book(net.tokens.ahmed, net.parkings.massira, 5, win);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
  });

  test('a start a few minutes in the past is tolerated (form filled a moment ago)', async () => {
    const res = await book(net.tokens.ahmed, net.parkings.massira, 5, window(-0.15, 1));
    expect(res.status).toBe(201);
  });

  test('a spot that does not exist keeps the original error', async () => {
    const res = await book(net.tokens.ahmed, net.parkings.massira, 99, window(1, 2));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Spot is not available or parking not found');
  });
});

describe('the double-booking race', () => {
  test('15 simultaneous requests for one spot and window: exactly one wins', async () => {
    const win = window(30, 32);
    const results = await Promise.all(
      Array.from({ length: 15 }, (_, i) => book(i % 2 ? net.tokens.ahmed : net.tokens.fatima, net.parkings.centre, 1, win))
    );
    const created = results.filter((r) => r.status === 201);
    expect(created).toHaveLength(1);
    expect(results.filter((r) => r.status !== 201).every((r) => [400, 409].includes(r.status))).toBe(true);
    expect(await Booking.countDocuments({ parkingId: net.parkings.centre._id, spotNumber: 1, status: 'active' })).toBe(1);
  });

  test('simultaneous partially-overlapping windows: still at most one', async () => {
    const base = Date.now() + 40 * HOUR;
    const windows = [0, 0.5, 1, 1.5, 2].map((offset) => window(offset, offset + 2, base));
    const results = await Promise.all(windows.map((w) => book(net.tokens.fatima, net.parkings.centre, 2, w)));
    const created = results.filter((r) => r.status === 201).map((r) => r.body);
    // Whatever won, no two accepted windows overlap.
    for (const a of created) {
      for (const b of created) {
        if (a._id === b._id) continue;
        const overlap = new Date(a.startTime) < new Date(b.endTime) && new Date(a.endTime) > new Date(b.startTime);
        expect(overlap).toBe(false);
      }
    }
    expect(created.length).toBeGreaterThanOrEqual(1);
  });

  test('the spot lock is released after the race', async () => {
    const res = await book(net.tokens.ahmed, net.parkings.centre, 1, window(50, 51));
    expect(res.status).toBe(201);
  });
});

describe('extend, check-in, check-out with time', () => {
  test('extending into the next booking is refused; free time is accepted', async () => {
    // 0.55 h is billed as 1 h; extending to 1.55 h bills 2 h, so it costs one hour.
    const first = await book(net.tokens.ahmed, net.parkings.massira, 6, window(-0.05, 0.5));
    await book(net.tokens.fatima, net.parkings.massira, 6, window(2, 3));

    const blocked = await api()
      .patch(`/api/bookings/${first.body._id}/extend`)
      .set(auth(net.tokens.ahmed))
      .send({ newEndTime: new Date(Date.now() + 2.5 * HOUR).toISOString() });
    expect(blocked.status).toBe(400);
    expect(blocked.body.message).toBe('The spot is booked by someone else after your slot');

    const ok = await api()
      .patch(`/api/bookings/${first.body._id}/extend`)
      .set(auth(net.tokens.ahmed))
      .send({ newEndTime: new Date(Date.now() + 1.5 * HOUR).toISOString() });
    expect(ok.status).toBe(200);
    expect(ok.body.addedPrice).toBe(8); // one extra hour at 8 MAD
  });

  test('checking in long before the slot is refused', async () => {
    const later = await book(net.tokens.ahmed, net.parkings.centre, 3, window(5, 6));
    const res = await api()
      .post(`/api/bookings/${later.body._id}/check-in`)
      .set(auth(net.tokens.owner2))
      .send({ qrToken: later.body.qrToken });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Too early: this booking has not started yet');
  });

  test('check-in marks the spot occupied; check-out frees it and credits loyalty once', async () => {
    const now = await book(net.tokens.ahmed, net.parkings.centre, 4, window(-0.05, 2));
    const qr = now.body.qrToken;

    const checkIn = await api().post('/api/bookings/check-in').set(auth(net.tokens.owner2)).send({ qrToken: qr });
    expect(checkIn.status).toBe(200);
    expect(await spotStatus(net.parkings.centre._id, 4)).toBe('occupied');

    const [a, b] = await Promise.all([
      api().post(`/api/bookings/${now.body._id}/check-out`).set(auth(net.tokens.owner2)),
      api().post(`/api/bookings/${now.body._id}/check-out`).set(auth(net.tokens.owner2)),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 410]);
    expect(await spotStatus(net.parkings.centre._id, 4)).toBe('available');

    const LoyaltyPoints = require('../src/models/LoyaltyPoints');
    const points = await LoyaltyPoints.findOne({ userId: net.users.ahmed._id, parkingId: net.parkings.centre._id });
    expect(points.bookingCount).toBe(1);
  });

  test('cancelling a covering booking frees the spot', async () => {
    const res = await book(net.tokens.fatima, net.parkings.street, 1, window(-0.05, 1));
    expect(await spotStatus(net.parkings.street._id, 1)).toBe('reserved');
    await api().patch(`/api/bookings/${res.body._id}/cancel`).set(auth(net.tokens.fatima));
    expect(await spotStatus(net.parkings.street._id, 1)).toBe('available');
  });
});
