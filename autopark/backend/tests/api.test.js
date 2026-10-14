const { api, auth, book, window, resetDatabase, disconnect, seedNetwork } = require('./helpers');

let net;

beforeAll(async () => {
  await resetDatabase();
  net = await seedNetwork();
  // Five bookings for Ahmed, one hour apart on the same spot.
  for (let i = 0; i < 5; i += 1) {
    await book(net.tokens.ahmed, net.parkings.massira, 1, window(2 + i, 3 + i));
  }
});
afterAll(disconnect);

describe('pagination (opt-in, body shape unchanged)', () => {
  test('without page/limit: the full array, with the total in a header', async () => {
    const res = await api().get('/api/bookings').set(auth(net.tokens.ahmed));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(5);
    expect(res.headers['x-total-count']).toBe('5');
    expect(res.headers['x-page']).toBeUndefined();
  });

  test('with page/limit: that page, plus page metadata', async () => {
    const p1 = await api().get('/api/bookings?page=1&limit=2').set(auth(net.tokens.ahmed));
    expect(p1.body).toHaveLength(2);
    expect(p1.headers).toMatchObject({ 'x-total-count': '5', 'x-page': '1', 'x-limit': '2', 'x-pages': '3' });

    const p3 = await api().get('/api/bookings?page=3&limit=2').set(auth(net.tokens.ahmed));
    expect(p3.body).toHaveLength(1);

    const ids = new Set([...p1.body, ...p3.body].map((b) => b._id));
    expect(ids.size).toBe(3); // pages do not overlap
  });

  test('the newest booking comes first', async () => {
    const res = await api().get('/api/bookings').set(auth(net.tokens.ahmed));
    const created = res.body.map((b) => new Date(b.createdAt).getTime());
    expect(created).toEqual([...created].sort((a, b) => b - a));
  });

  test('absurd limits are clamped', async () => {
    const big = await api().get('/api/bookings?limit=100000').set(auth(net.tokens.ahmed));
    expect(big.headers['x-limit']).toBe('200');
    const zero = await api().get('/api/bookings?limit=0&page=-4').set(auth(net.tokens.ahmed));
    expect(zero.headers['x-page']).toBe('1');
    expect(Number(zero.headers['x-limit'])).toBeGreaterThan(0);
  });

  test('the old /api/reservations alias paginates the same way', async () => {
    const res = await api().get('/api/reservations?page=1&limit=4').set(auth(net.tokens.ahmed));
    expect(res.body).toHaveLength(4);
    expect(res.headers['x-total-count']).toBe('5');
  });

  test('browsers on the portal origin can read the pagination headers', async () => {
    const res = await api().get('/api/bookings').set('Origin', 'http://localhost:5173').set(auth(net.tokens.ahmed));
    expect(res.headers['access-control-expose-headers']).toMatch(/X-Total-Count/);
  });

  test('an unknown browser origin gets no CORS grant', async () => {
    const res = await api().get('/api/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('admin lists paginate too', async () => {
    const res = await api().get('/api/admin/users?page=1&limit=3').set(auth(net.tokens.admin));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.headers['x-total-count']).toBe('6');
  });
});

describe('parkings near me', () => {
  // Place Dchira, next to Parking Centre Ville.
  const here = { lat: 27.1502, lng: -13.1989 };

  test('results come nearest first, with their distance in metres', async () => {
    const res = await api().get('/api/parkings/near').query(here);
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('Parking Centre Ville');
    expect(res.body[0].distanceMeters).toBeLessThan(10);
    const distances = res.body.map((p) => p.distanceMeters);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
    expect(res.body.map((p) => p.name).sort()).toEqual(['Parking Al Massira', 'Parking Centre Ville', 'Rue Al Kabir']);
  });

  test('the radius limits the results', async () => {
    const res = await api().get('/api/parkings/near').query({ ...here, radius: 300 });
    expect(res.body.map((p) => p.name)).toEqual(['Parking Centre Ville']);
  });

  test('anonymous results are shaped like the public listing', async () => {
    const res = await api().get('/api/parkings/near').query(here);
    expect(res.body.every((p) => p.ownerId === undefined && p.commissionPercent === undefined)).toBe(true);
  });

  test.each([
    [{}, 'missing'],
    [{ lat: 'abc', lng: -13.2 }, 'not a number'],
    [{ lat: 95, lng: -13.2 }, 'out of range'],
  ])('bad coordinates (%p, %s) are a 400', async (query) => {
    const res = await api().get('/api/parkings/near').query(query);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Valid latitude and longitude are required');
  });
});

describe('revenue reports', () => {
  // The bookings start a few hours from now, which may already be tomorrow.
  const d = new Date(Date.now() + 2 * 24 * 3600 * 1000);
  const to = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

  test('JSON by default, scoped to the network for an admin', async () => {
    const res = await api().get('/api/reports/revenue').query({ to }).set(auth(net.tokens.admin));
    expect(res.status).toBe(200);
    expect(res.body.scope).toBe('network');
    expect(res.body.parkings).toHaveLength(3);
    expect(res.body.totals.bookings).toBe(5);
  });

  test('CSV download', async () => {
    const res = await api().get('/api/reports/revenue?format=csv').set(auth(net.tokens.owner1));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="autopark-revenus-.+\.csv"/);
    expect(res.text).toMatch(/Date/);
    expect(res.text).toMatch(/Réservations/);
  });

  test('PDF download', async () => {
    const res = await api()
      .get('/api/reports/revenue?format=pdf')
      .set(auth(net.tokens.owner1))
      .buffer(true)
      .parse((r, cb) => {
        const chunks = [];
        r.on('data', (c) => chunks.push(c));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
    expect(res.body.length).toBeGreaterThan(1000);
  });

  test('an invalid range is a 400', async () => {
    const res = await api().get('/api/reports/revenue?from=yesterday-ish&to=2026-01-01').set(auth(net.tokens.admin));
    expect(res.status).toBe(400);
  });
});

describe('health', () => {
  test('GET /api/health', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
