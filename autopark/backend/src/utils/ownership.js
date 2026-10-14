// Tenancy helpers.
//
// `middleware/role.js` answers "is this user an admin / an owner / a driver?".
// These answer the separate question "does THIS document belong to THIS user?".
// Both checks are needed: role alone let any parking_owner act on another
// owner's bookings and complaints.

// Accepts an ObjectId, a string id, or a populated document.
const idOf = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
};

const sameId = (a, b) => {
  const left = idOf(a);
  const right = idOf(b);
  return left !== null && right !== null && left === right;
};

// The driver who made the booking, or an admin.
const ownsBooking = (booking, user) =>
  user.role === 'admin' || sameId(booking.userId, user._id);

// An admin, or the parking_owner this parking belongs to.
// `parking` may be a Parking document/lean object or a populated parkingId.
const managesParking = (parking, user) =>
  user.role === 'admin' ||
  (user.role === 'parking_owner' && sameId(parking && parking.ownerId, user._id));

module.exports = { idOf, sameId, ownsBooking, managesParking };
