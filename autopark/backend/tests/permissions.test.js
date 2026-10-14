const { api, auth, book, window, resetDatabase, disconnect, seedNetwork } = require('./helpers');

let net;
let ahmedBooking; // on owner1's Parking Al Massira
let centreBooking; // on owner2's Parking Centre Ville

beforeAll(async () => {
  await resetDatabase();
  net = await seedNetwork();
  ahmedBooking = (await book(net.tokens.ahmed, net.parkings.massira, 1, window(-0.05, 2))).body;
  centreBooking = (await book(net.tokens.fatima, net.parkings.centre, 1, window(-0.05, 2))).body;
});
afterAll(disconnect);

describe('drivers only reach their own bookings (IDOR)', () => {
  test('another driver cannot read, cancel or extend a booking', async () => {
    const id = ahmedBooking._id;
    expect((await api().get(`/api/bookings/${id}`).set(auth(net.tokens.fatima))).status).toBe(403);
    expect((await api().patch(`/api/bookings/${id}/cancel`).set(auth(net.tokens.fatima))).status).toBe(403);
    const extend = await api()
      .patch(`/api/bookings/${id}/extend`)
      .set(auth(net.tokens.fatima))
      .send({ newEndTime: new Date(Date.now() + 3 * 3600 * 1000).toISOString() });
    expect(extend.status).toBe(403);
  });

  test('the driver can read their own booking', async () => {
    expect((await api().get(`/api/bookings/${ahmedBooking._id}`).set(auth(net.tokens.ahmed))).status).toBe(200);
  });

  test('a driver cannot pay for someone else', async () => {
    const res = await api()
      .post(`/api/payments/booking/${ahmedBooking._id}`)
      .set(auth(net.tokens.fatima))
      .send({ method: 'card' });
    expect(res.status).toBe(403);
  });
});

describe('owners are confined to their own parkings (tenancy)', () => {
  test("owner2 cannot complete, check in or check out owner1's booking", async () => {
    const id = ahmedBooking._id;
    expect((await api().patch(`/api/bookings/${id}/complete`).set(auth(net.tokens.owner2))).status).toBe(403);
    const checkIn = await api()
      .post(`/api/bookings/${id}/check-in`)
      .set(auth(net.tokens.owner2))
      .send({ qrToken: ahmedBooking.qrToken });
    expect(checkIn.status).toBe(403);
    expect((await api().post(`/api/bookings/${id}/check-out`).set(auth(net.tokens.owner2))).status).toBe(403);
  });

  test("owner2 cannot read owner1's booking", async () => {
    expect((await api().get(`/api/bookings/${ahmedBooking._id}`).set(auth(net.tokens.owner2))).status).toBe(403);
  });

  test("owner2 cannot resolve a complaint about owner1's parking", async () => {
    const complaint = await api()
      .post('/api/complaints')
      .set(auth(net.tokens.ahmed))
      .send({ parkingId: String(net.parkings.massira._id), message: 'Barrière bloquée à l’entrée depuis ce matin.' });
    expect(complaint.status).toBe(201);
    const resolve = await api().patch(`/api/complaints/${complaint.body._id}/resolve`).set(auth(net.tokens.owner2));
    expect(resolve.status).toBe(403);
  });

  test("owner2 cannot collect cash for owner1's parking", async () => {
    const cash = await api()
      .post(`/api/payments/booking/${ahmedBooking._id}`)
      .set(auth(net.tokens.ahmed))
      .send({ method: 'cash' });
    expect(cash.status).toBe(201);
    const collect = await api().post(`/api/payments/${cash.body.payment._id}/collect`).set(auth(net.tokens.owner2));
    expect(collect.status).toBe(403);
  });

  test('regression: ?parkingId cannot widen an owner\'s payment list to a competitor', async () => {
    // owner2 asks explicitly for owner1's parking.
    const res = await api()
      .get('/api/payments')
      .query({ parkingId: String(net.parkings.massira._id) })
      .set(auth(net.tokens.owner2));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  test("an owner's revenue report covers only their parkings", async () => {
    const res = await api().get('/api/reports/revenue').set(auth(net.tokens.owner2));
    expect(res.status).toBe(200);
    expect(res.body.scope).toBe('owner');
    expect(res.body.parkings.map((p) => p.name)).toEqual(['Parking Centre Ville']);
  });
});

describe('roles', () => {
  test('a technician cannot validate entries on a private parking', async () => {
    const res = await api()
      .post('/api/bookings/check-in')
      .set(auth(net.tokens.tech))
      .send({ qrToken: centreBooking.qrToken });
    expect(res.status).toBe(403);
  });

  test('a driver cannot use staff endpoints', async () => {
    expect((await api().get('/api/payments').set(auth(net.tokens.ahmed))).status).toBe(403);
    expect((await api().get('/api/reports/revenue').set(auth(net.tokens.ahmed))).status).toBe(403);
    expect((await api().get('/api/admin/stats').set(auth(net.tokens.ahmed))).status).toBe(403);
    const scan = await api()
      .post('/api/bookings/check-in')
      .set(auth(net.tokens.ahmed))
      .send({ qrToken: ahmedBooking.qrToken });
    expect(scan.status).toBe(403);
  });

  test('registering cannot grant a staff role', async () => {
    const res = await api().post('/api/auth/register').send({
      fullName: 'Intrus',
      email: 'intrus@test.ma',
      password: 'secret123',
      role: 'admin',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
  });

  test('no token, bad token: 401', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401);
    expect((await api().get('/api/auth/me').set(auth('not.a.jwt'))).status).toBe(401);
  });
});
