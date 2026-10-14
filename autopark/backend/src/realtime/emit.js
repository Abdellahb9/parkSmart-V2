const Parking = require('../models/Parking');

/**
 * The single place the server publishes realtime events.
 *
 * Controllers never touch socket.io directly: they call these semantic
 * helpers, so an event looks identical whether it came from an HTTP request
 * or from a background job later on. Every helper is a no-op when no socket
 * server is attached, which keeps tests and scripts working unchanged.
 */

let io = null;

const attach = (server) => {
  io = server;
};

const namespace = () => (io ? io.of('/rt') : null);

const publish = (rooms, event, payload) => {
  const ns = namespace();
  if (!ns) return;
  const body = { ...payload, at: new Date().toISOString() };
  for (const room of rooms.filter(Boolean)) ns.to(room).emit(event, body);
};

/** Recomputes and broadcasts live availability for one parking. */
const publishAvailability = async (parkingId) => {
  if (!namespace() || !parkingId) return;
  try {
    const parking = await Parking.findById(parkingId).select('spots totalSpots name type').lean();
    if (!parking) return;
    const spots = parking.spots || [];
    publish([`parking:${parkingId}`, 'role:admin'], 'availability:update', {
      parkingId: String(parkingId),
      name: parking.name,
      type: parking.type,
      totalSpots: parking.totalSpots,
      availableSpots: spots.filter((s) => s.status === 'available').length,
      occupiedSpots: spots.filter((s) => s.status !== 'available').length,
    });
  } catch {
    // Realtime is best-effort: never fail a request because a broadcast failed.
  }
};

const roomsFor = (booking, ownerId) => [
  `user:${booking.userId}`,
  ownerId ? `owner:${ownerId}` : null,
  'role:admin',
];

const bookingCreated = ({ booking, parking }) => {
  publish(roomsFor(booking, parking && parking.ownerId), 'booking:created', {
    bookingId: String(booking._id),
    parkingId: String(booking.parkingId),
    spotNumber: booking.spotNumber,
    startTime: booking.startTime,
    endTime: booking.endTime,
    totalPrice: booking.totalPrice,
  });
};

const spotReleased = ({ booking, reason }) => {
  publish(roomsFor(booking), 'booking:released', {
    bookingId: String(booking._id),
    parkingId: String(booking.parkingId),
    spotNumber: booking.spotNumber,
    reason,
  });
};

const spotStateChanged = ({ booking, status }) => {
  publish(roomsFor(booking), 'booking:checkin', {
    bookingId: String(booking._id),
    parkingId: String(booking.parkingId),
    spotNumber: booking.spotNumber,
    status,
  });
};

/**
 * Spots whose live state actually changed — after a booking, a check-in, or
 * because a booked window just opened or closed. Sent by availability.refresh,
 * the only place that knows the real before/after.
 */
const spotsChanged = ({ parkingId, changes }) => {
  if (!changes || !changes.length) return;
  for (const change of changes) {
    publish([`parking:${parkingId}`, 'role:admin'], 'spot:state', {
      parkingId: String(parkingId),
      spotNumber: change.spotNumber,
      status: change.status,
    });
  }
  publishAvailability(parkingId);
};

/** A checked-in car is past its booked end. */
const bookingOverstay = ({ booking, ownerId }) => {
  publish(roomsFor(booking, ownerId), 'booking:overstay', {
    bookingId: String(booking._id),
    parkingId: String(booking.parkingId),
    spotNumber: booking.spotNumber,
    endTime: booking.endTime,
  });
};

const bookingExtended = ({ booking, addedPrice }) => {
  publish(roomsFor(booking), 'booking:extended', {
    bookingId: String(booking._id),
    parkingId: String(booking.parkingId),
    newEndTime: booking.endTime,
    totalPrice: booking.totalPrice,
    addedPrice,
  });
};

/**
 * Closes every live socket of an account whose sessions were just revoked
 * (password change, account disabled, "sign out everywhere"). The handshake
 * would refuse a reconnect anyway; this ends connections already open.
 */
const disconnectUser = (userId) => {
  const ns = namespace();
  if (!ns || !userId) return;
  ns.in(`user:${userId}`).disconnectSockets(true);
};

module.exports = {
  attach,
  disconnectUser,
  publish,
  publishAvailability,
  bookingCreated,
  spotReleased,
  spotStateChanged,
  spotsChanged,
  bookingOverstay,
  bookingExtended,
};
