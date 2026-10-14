const jwt = require('jsonwebtoken');

const RefreshToken = require('../src/models/RefreshToken');
const { authenticate } = require('../src/auth/tokens');
const { translate } = require('../src/i18n/messages');
const { api, auth, resetDatabase, disconnect, seedNetwork } = require('./helpers');

let net;

beforeAll(async () => {
  await resetDatabase();
  net = await seedNetwork();
});
afterAll(disconnect);
afterEach(() => {
  delete process.env.REFRESH_REUSE_GRACE_MS;
});

const login = (email, mode, password = 'secret123') => {
  const req = api().post('/api/auth/login');
  if (mode) req.set('X-Auth-Mode', mode);
  return req.send({ email, password });
};
const refreshWith = (refreshToken) => api().post('/api/auth/refresh').send({ refreshToken });
const me = (token) => api().get('/api/auth/me').set(auth(token));
const lifetime = (token) => {
  const { iat, exp } = jwt.decode(token);
  return exp - iat;
};
const cookieOf = (res) => (res.headers['set-cookie'] || []).find((c) => c.startsWith('ap_rt='));
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

describe('legacy mode (no X-Auth-Mode): unchanged for existing clients', () => {
  test('login returns one long-lived token and nothing else', async () => {
    const res = await login('ahmed@test.ma');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['token', 'user']);
    expect(lifetime(res.body.token)).toBe(3600); // JWT_EXPIRES_IN=1h in tests
    expect(cookieOf(res)).toBeUndefined();
    expect((await me(res.body.token)).status).toBe(200);
  });

  test('register keeps its shape too', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ fullName: 'Salma Bennani', email: 'salma@test.ma', password: 'secret123', phone: '+212611223344' });
    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(['token', 'user']);
  });
});

describe('refresh mode (mobile)', () => {
  test('login returns a short access token and a refresh token', async () => {
    const res = await login('fatima@test.ma', 'refresh');
    expect(res.status).toBe(200);
    expect(lifetime(res.body.token)).toBe(15 * 60);
    expect(typeof res.body.refreshToken).toBe('string');
    expect(res.body.refreshToken.length).toBeGreaterThan(40);
    expect(new Date(res.body.accessTokenExpiresAt).getTime()).toBeGreaterThan(Date.now());
    expect((await me(res.body.token)).status).toBe(200);
  });

  test('refresh tokens are stored hashed, never in clear', async () => {
    const { body } = await login('fatima@test.ma', 'refresh');
    const stored = await RefreshToken.find({ userId: net.users.fatima._id }).lean();
    expect(stored.length).toBeGreaterThan(0);
    expect(stored.some((t) => t.tokenHash === body.refreshToken)).toBe(false);
  });

  test('refreshing rotates: a new pair each time, both working', async () => {
    const first = await login('fatima@test.ma', 'refresh');
    const second = await refreshWith(first.body.refreshToken);
    expect(second.status).toBe(200);
    expect(second.body.refreshToken).not.toBe(first.body.refreshToken);
    expect(second.body.user.email).toBe('fatima@test.ma');
    expect((await me(second.body.token)).status).toBe(200);
    const third = await refreshWith(second.body.refreshToken);
    expect(third.status).toBe(200);
  });

  test('replaying a rotated token ends that device session (theft detection)', async () => {
    process.env.REFRESH_REUSE_GRACE_MS = '1';
    const first = await login('fatima@test.ma', 'refresh');
    const second = await refreshWith(first.body.refreshToken);
    await pause(10);

    const replay = await refreshWith(first.body.refreshToken);
    expect(replay.status).toBe(401);
    expect(replay.body.message).toBe('Session expired, please sign in again');
    // The legitimate successor is revoked too: the family is burnt.
    expect((await refreshWith(second.body.refreshToken)).status).toBe(401);
  });

  test('two tabs refreshing together within the grace window both succeed', async () => {
    process.env.REFRESH_REUSE_GRACE_MS = '60000';
    const { body } = await login('fatima@test.ma', 'refresh');
    const [a, b] = await Promise.all([refreshWith(body.refreshToken), refreshWith(body.refreshToken)]);
    expect([a.status, b.status]).toEqual([200, 200]);
  });

  test('another device is unaffected by one device being burnt', async () => {
    process.env.REFRESH_REUSE_GRACE_MS = '1';
    const phone = await login('fatima@test.ma', 'refresh');
    const tablet = await login('fatima@test.ma', 'refresh');
    await refreshWith(phone.body.refreshToken);
    await pause(10);
    await refreshWith(phone.body.refreshToken); // replay burns the phone only
    expect((await refreshWith(tablet.body.refreshToken)).status).toBe(200);
  });

  test('garbage, missing and expired refresh tokens are refused', async () => {
    expect((await refreshWith('not-a-token')).status).toBe(401);
    expect((await api().post('/api/auth/refresh').send({})).status).toBe(401);

    const { body } = await login('fatima@test.ma', 'refresh');
    await RefreshToken.updateMany({ userId: net.users.fatima._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await refreshWith(body.refreshToken)).status).toBe(401);
  });

  test('logout ends the device session; calling it again is harmless', async () => {
    const { body } = await login('ahmed@test.ma', 'refresh');
    const out = await api().post('/api/auth/logout').send({ refreshToken: body.refreshToken });
    expect(out.status).toBe(200);
    expect((await refreshWith(body.refreshToken)).status).toBe(401);
    expect((await api().post('/api/auth/logout').send({ refreshToken: body.refreshToken })).status).toBe(200);
    expect((await api().post('/api/auth/logout').send({})).status).toBe(200);
  });
});

describe('cookie mode (web portal)', () => {
  test('the refresh token goes into an httpOnly, SameSite=Strict cookie scoped to /api/auth', async () => {
    const res = await login('owner1@test.ma', 'cookie');
    expect(res.status).toBe(200);
    expect(res.body.refreshToken).toBeUndefined();
    const cookie = cookieOf(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/auth/);
    expect(lifetime(res.body.token)).toBe(15 * 60);
  });

  test('refreshing from the cookie needs the X-Requested-With header (CSRF guard)', async () => {
    const res = await login('owner1@test.ma', 'cookie');
    const cookie = cookieOf(res).split(';')[0];

    const bare = await api().post('/api/auth/refresh').set('Cookie', cookie);
    expect(bare.status).toBe(403);

    const ok = await api().post('/api/auth/refresh').set('Cookie', cookie).set('X-Requested-With', 'autopark-web');
    expect(ok.status).toBe(200);
    expect(ok.body.refreshToken).toBeUndefined();
    expect(cookieOf(ok)).toBeDefined();
    expect(cookieOf(ok).split(';')[0]).not.toBe(cookie); // rotated
    expect((await me(ok.body.token)).status).toBe(200);
  });

  test('logout clears the cookie and kills the session behind it', async () => {
    const res = await login('owner1@test.ma', 'cookie');
    const cookie = cookieOf(res).split(';')[0];
    const out = await api().post('/api/auth/logout').set('Cookie', cookie);
    expect(out.status).toBe(200);
    expect(cookieOf(out)).toMatch(/ap_rt=;/);
    const after = await api().post('/api/auth/refresh').set('Cookie', cookie).set('X-Requested-With', 'autopark-web');
    expect(after.status).toBe(401);
  });
});

describe('revocation', () => {
  test('sign out everywhere: legacy tokens, access tokens and refresh tokens all stop working', async () => {
    const legacy = (await login('ahmed@test.ma')).body.token;
    const mobile = (await login('ahmed@test.ma', 'refresh')).body;

    const res = await api().post('/api/auth/logout-all').set(auth(mobile.token));
    expect(res.status).toBe(200);

    for (const token of [legacy, mobile.token]) {
      const r = await me(token);
      expect(r.status).toBe(401);
      expect(r.body.message).toBe('Session expired, please sign in again');
    }
    expect((await refreshWith(mobile.refreshToken)).status).toBe(401);
    // Signing in again works.
    expect((await login('ahmed@test.ma')).status).toBe(200);
  });

  test('the socket handshake applies the same check', async () => {
    const token = (await login('ahmed@test.ma')).body.token;
    await expect(authenticate(token)).resolves.toBeTruthy();
    await api().post('/api/auth/logout-all').set(auth(token));
    await expect(authenticate(token)).rejects.toThrow('Session expired, please sign in again');
  });
});

describe('change password', () => {
  let phone;
  let laptop;

  beforeAll(async () => {
    phone = (await login('tech@test.ma', 'refresh')).body;
    laptop = (await login('tech@test.ma')).body;
  });

  test.each([
    [{ currentPassword: 'wrong-password', newPassword: 'Laayoune2026!' }, 'Current password is incorrect'],
    [{ currentPassword: 'secret123', newPassword: 'short' }, 'New password must be at least 8 characters'],
    [{ currentPassword: 'secret123', newPassword: 'secret123' }, 'The new password must be different from the current one'],
    [{ currentPassword: 'secret123', newPassword: { $gt: '' } }, 'New password must be at least 8 characters'],
  ])('refuses %p with a 400 that keeps the session', async (body, message) => {
    const res = await api().post('/api/auth/change-password').set(auth(phone.token)).send(body);
    expect(res.status).toBe(400);
    const messages = [res.body.message, ...(res.body.errors || []).map((e) => e.message)];
    expect(messages).toContain(message);
    expect((await me(phone.token)).status).toBe(200);
  });

  test('a successful change keeps this device signed in and signs every other one out', async () => {
    const res = await api()
      .post('/api/auth/change-password')
      .set(auth(phone.token))
      .set('X-Auth-Mode', 'refresh')
      .send({ currentPassword: 'secret123', newPassword: 'Laayoune2026!' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password changed');

    // This device got a fresh pair.
    expect((await me(res.body.token)).status).toBe(200);
    expect((await refreshWith(res.body.refreshToken)).status).toBe(200);
    // Everything issued before is dead.
    expect((await me(phone.token)).status).toBe(401);
    expect((await me(laptop.token)).status).toBe(401);
    expect((await refreshWith(phone.refreshToken)).status).toBe(401);

    expect((await login('tech@test.ma', null, 'secret123')).status).toBe(401);
    expect((await login('tech@test.ma', null, 'Laayoune2026!')).status).toBe(200);
  });

  test('needs a signed-in caller', async () => {
    const res = await api().post('/api/auth/change-password').send({ currentPassword: 'a', newPassword: 'bbbbbbbb' });
    expect(res.status).toBe(401);
  });
});

describe('disabling an account (admin)', () => {
  const setStatus = (token, id, isActive) =>
    api().patch(`/api/admin/users/${id}/status`).set(auth(token)).send({ isActive });

  test('a disabled account is signed out at once and cannot sign back in', async () => {
    const session = (await login('owner2@test.ma', 'refresh')).body;

    const res = await setStatus(net.tokens.admin, net.users.owner2._id, false);
    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
    expect(res.body.password).toBeUndefined();
    expect(res.body.tokenVersion).toBeUndefined();

    const r = await me(session.token);
    expect(r.status).toBe(401);
    expect((await refreshWith(session.refreshToken)).status).toBe(401);

    const again = await login('owner2@test.ma');
    expect(again.status).toBe(403);
    expect(again.body.message).toBe('This account has been disabled');

    const fr = await login('owner2@test.ma').set('X-App-Language', 'fr');
    expect(fr.body.message).toBe(translate('This account has been disabled', 'fr'));
  });

  test('re-enabling lets the account sign in again; its history is intact', async () => {
    expect((await setStatus(net.tokens.admin, net.users.owner2._id, true)).status).toBe(200);
    const res = await login('owner2@test.ma');
    expect(res.status).toBe(200);
    const parkings = await api().get('/api/parkings').set(auth(res.body.token));
    expect(parkings.body.find((p) => p.name === 'Parking Centre Ville').commissionPercent).toBe(12);
  });

  test('guards: not yourself, admins only, real booleans only', async () => {
    const self = await setStatus(net.tokens.admin, net.users.admin._id, false);
    expect(self.status).toBe(400);
    expect(self.body.message).toBe('You cannot disable your own account');

    expect((await setStatus(net.tokens.owner1, net.users.fatima._id, false)).status).toBe(403);
    expect((await setStatus(net.tokens.admin, net.users.fatima._id, 'no')).status).toBe(400);
    expect((await setStatus(net.tokens.admin, 'not-an-id', false)).status).toBe(400);
  });

  test('the admin user list shows the status', async () => {
    const res = await api().get('/api/admin/users').set(auth(net.tokens.admin));
    const fatima = res.body.find((u) => u.email === 'fatima@test.ma');
    expect(fatima.isActive).toBe(true);
    expect(fatima.tokenVersion).toBeUndefined();
  });
});

describe('response envelope (X-Response-Envelope: 1)', () => {
  const enveloped = (req) => req.set('X-Response-Envelope', '1');

  test('success: { success, data, error: null }', async () => {
    const res = await enveloped(api().get('/api/health'));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, error: null, data: { status: 'ok' } });
  });

  test('lists carry their pagination in meta', async () => {
    const res = await enveloped(api().get('/api/admin/users?page=1&limit=2').set(auth(net.tokens.admin)));
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({ total: expect.any(Number), page: 1, limit: 2, pages: expect.any(Number) });
  });

  test('errors: { success: false, data: null, error: { status, message, errors? } }', async () => {
    const missing = await enveloped(api().get('/api/nope'));
    expect(missing.status).toBe(404);
    expect(missing.body.success).toBe(false);
    expect(missing.body.data).toBeNull();
    expect(missing.body.error.status).toBe(404);

    const invalid = await enveloped(api().post('/api/auth/login').send({ email: 'x' }));
    expect(invalid.body.error.message).toBe('Validation failed');
    expect(invalid.body.error.errors.length).toBeGreaterThan(0);
  });

  test('works together with X-App-Language', async () => {
    const res = await enveloped(api().get('/api/auth/me')).set('X-App-Language', 'fr');
    expect(res.body.error.message).toBe(translate('Not authorized, no token provided', 'fr'));
  });

  test('without the header nothing changes', async () => {
    const res = await api().get('/api/health');
    expect(res.body.success).toBeUndefined();
    expect(res.body.status).toBe('ok');
  });
});

describe('request ids', () => {
  test('every response has one; a well-formed incoming id is kept', async () => {
    const fresh = await api().get('/api/health');
    expect(fresh.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);

    const kept = await api().get('/api/health').set('X-Request-Id', 'mobile-7f3a9c21');
    expect(kept.headers['x-request-id']).toBe('mobile-7f3a9c21');

    const replaced = await api().get('/api/health').set('X-Request-Id', '<script>');
    expect(replaced.headers['x-request-id']).not.toBe('<script>');
  });
});
