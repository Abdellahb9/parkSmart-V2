const Parking = require('../src/models/Parking');
const { clean } = require('../src/middleware/sanitize');
const { translate } = require('../src/i18n/messages');
const { api, auth, book, window, resetDatabase, disconnect, seedNetwork } = require('./helpers');

let net;

beforeAll(async () => {
  await resetDatabase();
  net = await seedNetwork();
});
afterAll(disconnect);
afterEach(() => jest.restoreAllMocks());

describe('NoSQL operator injection', () => {
  test('a login with {"$ne": null} as the email is refused, not matched', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: 'secret123' });
    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  test('operators in the password field do not bypass the check', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'ahmed@test.ma', password: { $gt: '' } });
    expect([400, 401]).toContain(res.status);
    expect(res.body.token).toBeUndefined();
  });

  test('operators in the query string are stripped', async () => {
    // ?status[$ne]=paid would otherwise list every payment whatever its status.
    const res = await api().get('/api/payments?status[$ne]=paid').set(auth(net.tokens.admin));
    expect(res.status).toBe(200);
  });

  test('the sanitizer removes $-keys and dotted keys at any depth, and nothing else', () => {
    const input = {
      email: 'a@b.ma',
      $where: 'sleep(1000)',
      nested: { ok: 1, $gt: '', 'profile.role': 'admin', deeper: [{ $set: { role: 'admin' }, keep: true }] },
    };
    expect(clean(input)).toEqual({ email: 'a@b.ma', nested: { ok: 1, deeper: [{ keep: true }] } });
  });

  test('a profile update cannot smuggle a role change through a dotted path', async () => {
    const res = await api()
      .patch('/api/auth/me')
      .set(auth(net.tokens.ahmed))
      .send({ fullName: 'Ahmed Sahraoui', role: 'admin', 'role.x': 'admin', $set: { role: 'admin' } });
    expect(res.status).toBe(200);
    const me = await api().get('/api/auth/me').set(auth(net.tokens.ahmed));
    expect((me.body.user || me.body).role).toBe('user');
  });
});

describe('errors are mapped, never leaked', () => {
  test('a malformed id is a 400 "Invalid id", not a 500', async () => {
    const booking = await api().get('/api/bookings/not-an-id').set(auth(net.tokens.ahmed));
    expect(booking.status).toBe(400);
    expect(booking.body).toEqual({ message: 'Invalid id' });

    const parking = await api().get('/api/parkings/12345');
    expect(parking.status).toBe(400);
  });

  test('malformed JSON is a 400', async () => {
    const res = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "ahmed@test.ma", ');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Malformed JSON body' });
  });

  test('an unexpected failure answers a bare "Server error" with no internals', async () => {
    jest.spyOn(Parking, 'find').mockImplementation(() => {
      throw new Error('connection to mongo-internal-7.autopark.local:27017 lost');
    });
    const res = await api().get('/api/parkings');
    expect(res.status).toBe(500);
    // Only the message and an id to find the failure in the logs.
    expect(res.body).toEqual({ message: 'Server error', requestId: res.headers['x-request-id'] });
    expect(res.body.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(res.body)).not.toMatch(/mongo-internal/);
  });

  test('unknown routes are a JSON 404', async () => {
    const res = await api().get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/);
  });

  test('security headers are set', async () => {
    const res = await api().get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('what each caller may see about a parking', () => {
  const massira = (body) => body.find((p) => p.name === 'Parking Al Massira');

  test('anonymous: no owner, no commission, no spot map', async () => {
    const res = await api().get('/api/parkings');
    expect(res.status).toBe(200);
    const p = massira(res.body);
    expect(p.ownerId).toBeUndefined();
    expect(p.commissionPercent).toBeUndefined();
    expect(p.spots).toBeUndefined();
    expect(p.availableSpots).toBe(6);
  });

  test("a driver sees the owner's name but not their contact details or terms", async () => {
    const p = massira((await api().get('/api/parkings').set(auth(net.tokens.ahmed))).body);
    expect(Object.keys(p.ownerId).sort()).toEqual(['_id', 'fullName']);
    expect(p.commissionPercent).toBeUndefined();
    expect(p.spots).toBeUndefined();
  });

  test('the owner sees everything about their own parking only', async () => {
    const res = await api().get('/api/parkings').set(auth(net.tokens.owner1));
    expect(massira(res.body).commissionPercent).toBe(15);
    expect(massira(res.body).spots).toHaveLength(6);
    const competitor = res.body.find((p) => p.name === 'Parking Centre Ville');
    expect(competitor.commissionPercent).toBeUndefined();
  });

  test('spot maps need a signed-in caller', async () => {
    expect((await api().get(`/api/parkings/${net.parkings.massira._id}/spots`)).status).toBe(401);
  });

  test('passwords never come back', async () => {
    const users = await api().get('/api/admin/users').set(auth(net.tokens.admin));
    expect(users.status).toBe(200);
    expect(users.body.every((u) => u.password === undefined)).toBe(true);
  });
});

describe('localized messages (X-App-Language)', () => {
  const MSG = 'This spot is already booked for that time';
  let taken;

  beforeAll(async () => {
    taken = window(10, 12);
    await book(net.tokens.ahmed, net.parkings.centre, 1, taken);
  });

  const clash = (lang) => {
    const req = api()
      .post('/api/bookings')
      .set(auth(net.tokens.fatima))
      .send({ parkingId: String(net.parkings.centre._id), spotNumber: 1, carPlate: '9876-B-61', ...taken });
    return lang ? req.set('X-App-Language', lang) : req;
  };

  test('without the header the message is the original English', async () => {
    expect((await clash()).body.message).toBe(MSG);
  });

  test.each(['fr', 'ar'])('with X-App-Language: %s the message is translated', async (lang) => {
    const res = await clash(lang);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(translate(MSG, lang));
    expect(res.body.message).not.toBe(MSG);
  });

  test('an unsupported language falls back to English', async () => {
    expect((await clash('de')).body.message).toBe(MSG);
  });

  test('validation errors are translated too', async () => {
    const res = await api().post('/api/auth/login').set('X-App-Language', 'fr').send({ email: 'x', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.message).sort()).toEqual(
      [translate('Password is required', 'fr'), translate('Valid email is required', 'fr')].sort()
    );
  });

  test('a duplicate email on a profile update is a 409 that does not echo the value', async () => {
    const res = await api().patch('/api/auth/me').set(auth(net.tokens.ahmed)).send({ email: 'fatima@test.ma' });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ message: 'Already exists' });
  });
});
