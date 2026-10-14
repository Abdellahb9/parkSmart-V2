const { Server } = require('socket.io');
const { authenticate } = require('../auth/tokens');
const emit = require('./emit');

/**
 * Realtime availability over socket.io.
 *
 * One namespace (/rt), authenticated with the same JWT as the REST API.
 * Clients are placed in rooms by identity and role on connect, and subscribe
 * explicitly to the parkings they are displaying.
 */
const init = (httpServer, { origins }) => {
  const io = new Server(httpServer, {
    cors: { origin: origins, credentials: true },
    // The mobile client connects over websocket only.
    transports: ['websocket', 'polling'],
  });

  const ns = io.of('/rt');

  ns.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('UNAUTHORIZED'));
      // Same checks as the REST API: disabled accounts and revoked tokens are refused.
      const user = await authenticate(token);
      socket.data.user = { id: String(user._id), role: user.role };
      return next();
    } catch {
      return next(new Error('UNAUTHORIZED'));
    }
  });

  ns.on('connection', (socket) => {
    const { id, role } = socket.data.user;
    socket.join(`user:${id}`);
    socket.join(`role:${role}`);
    if (role === 'parking_owner') socket.join(`owner:${id}`);

    // Clients ask for the parkings currently on screen. Capped so one socket
    // cannot subscribe to the whole database.
    socket.on('subscribe:parkings', (payload, ack) => {
      const ids = Array.isArray(payload && payload.ids) ? payload.ids.slice(0, 50) : [];
      for (const parkingId of ids) socket.join(`parking:${parkingId}`);
      if (typeof ack === 'function') ack({ ok: true, joined: ids.length });
    });

    socket.on('unsubscribe:parkings', (payload, ack) => {
      const ids = Array.isArray(payload && payload.ids) ? payload.ids : [];
      for (const parkingId of ids) socket.leave(`parking:${parkingId}`);
      if (typeof ack === 'function') ack({ ok: true });
    });

    // Lets clients correct countdown drift against server time.
    socket.on('ping:presence', (_payload, ack) => {
      if (typeof ack === 'function') ack({ serverTime: new Date().toISOString() });
    });
  });

  emit.attach(io);
  return io;
};

module.exports = { init };
