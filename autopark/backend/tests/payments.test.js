const User = require('../src/models/User');
const Payment = require('../src/models/Payment');
const { api, auth, book, window, resetDatabase, disconnect, seedNetwork } = require('./helpers');

let net;

beforeAll(async () => {
  await resetDatabase();
  net = await seedNetwork();
});
afterAll(disconnect);

const pay = (token, bookingId, body) =>
  api().post(`/api/payments/booking/${bookingId}`).set(auth(token)).send(body);
const confirm = (token, paymentId, body = {}) =>
  api().post(`/api/payments/${paymentId}/confirm`).set(auth(token)).send(body);
const balanceOf = async (user) => (await User.findById(user._id).select('walletBalance').lean()).walletBalance ?? 0;

// Whole-hour windows in the future, so prices are exact: 2 h at 8 MAD = 16 MAD.
describe('wallet', () => {
  test('a card top-up is pending until confirmed, then credits the wallet', async () => {
    const top = await api().post('/api/payments/topup').set(auth(net.tokens.ahmed)).send({ amount: 100 });
    expect(top.status).toBe(201);
    expect(top.body.payment.status).toBe('pending');
    expect(await balanceOf(net.users.ahmed)).toBe(0);

    const done = await confirm(net.tokens.ahmed, top.body.payment._id);
    expect(done.status).toBe(200);
    expect(done.body.payment.status).toBe('paid');
    expect(done.body.walletBalance).toBe(100);

    // A settled charge cannot be confirmed (and credited) twice.
    expect((await confirm(net.tokens.ahmed, top.body.payment._id)).status).toBe(409);
    expect(await balanceOf(net.users.ahmed)).toBe(100);
  });

  test.each([
    [0, 'zero'],
    [-50, 'negative'],
    [6000, 'above the 5000 MAD ceiling'],
  ])('a top-up of %p (%s) is refused', async (amount) => {
    const res = await api().post('/api/payments/topup').set(auth(net.tokens.ahmed)).send({ amount });
    expect(res.status).toBe(400);
  });

  test('paying from the wallet debits it, records the commission and marks the booking paid', async () => {
    const booking = (await book(net.tokens.ahmed, net.parkings.massira, 1, window(1, 3))).body;
    expect(booking.totalPrice).toBe(16);

    const res = await pay(net.tokens.ahmed, booking._id, { method: 'wallet' });
    expect(res.status).toBe(201);
    expect(res.body.walletBalance).toBe(84);
    expect(res.body.payment).toMatchObject({ status: 'paid', amount: 16, commission: 2.4 }); // 15 %
    expect(res.body.booking.paymentStatus).toBe('paid');

    expect((await pay(net.tokens.ahmed, booking._id, { method: 'wallet' })).status).toBe(409);
  });

  test('an empty wallet answers 402 and leaves the booking unpaid', async () => {
    const booking = (await book(net.tokens.fatima, net.parkings.massira, 2, window(1, 3))).body;
    const res = await pay(net.tokens.fatima, booking._id, { method: 'wallet' });
    expect(res.status).toBe(402);
    expect(res.body.message).toBe('Insufficient wallet balance');
    expect(await Payment.countDocuments({ bookingId: booking._id })).toBe(0);
  });

  test('two simultaneous payments cannot overdraw the wallet', async () => {
    await User.updateOne({ _id: net.users.fatima._id }, { $set: { walletBalance: 20 } });
    const [a, b] = await Promise.all([
      book(net.tokens.fatima, net.parkings.massira, 3, window(1, 3)),
      book(net.tokens.fatima, net.parkings.massira, 4, window(1, 3)),
    ]);
    const results = await Promise.all([
      pay(net.tokens.fatima, a.body._id, { method: 'wallet' }),
      pay(net.tokens.fatima, b.body._id, { method: 'wallet' }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 402]);
    expect(await balanceOf(net.users.fatima)).toBe(4);
  });
});

describe('refunds', () => {
  test('cancelling a paid booking refunds the wallet minus the 20 % fee', async () => {
    const before = await balanceOf(net.users.ahmed);
    const booking = (await book(net.tokens.ahmed, net.parkings.massira, 5, window(4, 6))).body;
    await pay(net.tokens.ahmed, booking._id, { method: 'wallet' });
    expect(await balanceOf(net.users.ahmed)).toBe(before - 16);

    const res = await api().patch(`/api/bookings/${booking._id}/cancel`).set(auth(net.tokens.ahmed));
    expect(res.status).toBe(200);
    expect(res.body.cancellationFee).toBe(3.2);
    expect(res.body.refund).toMatchObject({ kind: 'refund', amount: 12.8, status: 'paid' });
    expect(res.body.booking.paymentStatus).toBe('refunded');
    expect(await balanceOf(net.users.ahmed)).toBe(before - 3.2);
  });

  test('cancelling an unpaid booking moves no money', async () => {
    const before = await balanceOf(net.users.ahmed);
    const booking = (await book(net.tokens.ahmed, net.parkings.massira, 6, window(4, 6))).body;
    const res = await api().patch(`/api/bookings/${booking._id}/cancel`).set(auth(net.tokens.ahmed));
    expect(res.status).toBe(200);
    expect(res.body.refund).toBeNull();
    expect(await balanceOf(net.users.ahmed)).toBe(before);
  });
});

describe('card and cash', () => {
  test('a declined card leaves the booking unpaid; a retry can succeed', async () => {
    const booking = (await book(net.tokens.fatima, net.parkings.centre, 1, window(1, 2))).body;

    const first = await pay(net.tokens.fatima, booking._id, { method: 'card' });
    expect(first.status).toBe(201);
    expect(first.body.payment.status).toBe('pending');
    const declined = await confirm(net.tokens.fatima, first.body.payment._id, { outcome: 'failure' });
    expect(declined.body.payment.status).toBe('failed');
    expect(declined.body.payment.failureReason).toBe('Paiement refusé par la banque');
    expect(declined.body.booking.paymentStatus).toBe('unpaid');

    const retry = await pay(net.tokens.fatima, booking._id, { method: 'card' });
    const ok = await confirm(net.tokens.fatima, retry.body.payment._id);
    expect(ok.body.payment.status).toBe('paid');
    expect(ok.body.booking.paymentStatus).toBe('paid');
  });

  test('an abandoned card attempt is cancelled when the driver tries again', async () => {
    const booking = (await book(net.tokens.fatima, net.parkings.centre, 2, window(1, 2))).body;
    const abandoned = await pay(net.tokens.fatima, booking._id, { method: 'card' });
    await pay(net.tokens.fatima, booking._id, { method: 'card' });
    expect((await Payment.findById(abandoned.body.payment._id)).status).toBe('cancelled');
    expect(await Payment.countDocuments({ bookingId: booking._id, status: 'pending' })).toBe(1);
  });

  test('cash stays pending until the owner collects it, once', async () => {
    const booking = (await book(net.tokens.ahmed, net.parkings.centre, 3, window(1, 2))).body;
    const cash = await pay(net.tokens.ahmed, booking._id, { method: 'cash' });
    expect(cash.status).toBe(201);
    expect(cash.body.booking.paymentStatus).toBe('pending');
    // The driver cannot settle cash themselves.
    expect((await confirm(net.tokens.ahmed, cash.body.payment._id)).status).toBe(400);

    const collected = await api().post(`/api/payments/${cash.body.payment._id}/collect`).set(auth(net.tokens.owner2));
    expect(collected.status).toBe(200);
    expect(collected.body.booking.paymentStatus).toBe('paid');
    expect(collected.body.payment.commission).toBe(1.2); // 12 % of 10 MAD

    const again = await api().post(`/api/payments/${cash.body.payment._id}/collect`).set(auth(net.tokens.owner2));
    expect(again.status).toBe(409);
  });
});

describe('staff views', () => {
  test("an owner's payment list holds only their parkings; the admin sees everything", async () => {
    const owner2 = await api().get('/api/payments').set(auth(net.tokens.owner2));
    expect(owner2.status).toBe(200);
    expect(owner2.body.length).toBeGreaterThan(0);
    expect(owner2.body.every((p) => p.parkingId.name === 'Parking Centre Ville')).toBe(true);

    const admin = await api().get('/api/payments').set(auth(net.tokens.admin));
    const names = new Set(admin.body.filter((p) => p.parkingId).map((p) => p.parkingId.name));
    expect(names).toEqual(new Set(['Parking Al Massira', 'Parking Centre Ville']));
  });

  test('net revenue is collected minus refunds minus commission', async () => {
    const res = await api().get('/api/reports/revenue').set(auth(net.tokens.owner1));
    expect(res.status).toBe(200);
    const { collected, refunded, commission, net: netRevenue } = res.body.totals;
    expect(netRevenue).toBeCloseTo(collected - refunded - commission, 2);
    expect(collected).toBeGreaterThan(0);
  });
});
