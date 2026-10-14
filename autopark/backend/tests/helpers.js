const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../src/app');
const User = require('../src/models/User');
const Parking = require('../src/models/Parking');

const HOUR = 60 * 60 * 1000;

/** Connects to the test database and empties it. Refuses anything not named *_test. */
const resetDatabase = async () => {
  if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGODB_URI);
  const name = mongoose.connection.name;
  if (!/_test$/.test(name)) {
    throw new Error(`Refusing to wipe "${name}": the test database name must end with _test.`);
  }
  await mongoose.connection.dropDatabase();
  // Unique indexes (email, qrToken) must exist for the tests that rely on them.
  await Promise.all(mongoose.modelNames().map((m) => mongoose.model(m).createIndexes()));
};

const disconnect = () => mongoose.disconnect();

/**
 * A small, realistic Laâyoune network: an admin, two competing owners, a
 * technician, two drivers, one private parking per owner and one street.
 * Tokens are minted directly, so tests do not pay bcrypt's cost per login.
 */
const seedNetwork = async () => {
  const mk = (fields) => User.create({ password: 'secret123', phone: '+212600000000', ...fields });
  const [admin, owner1, owner2, tech, ahmed, fatima] = await Promise.all([
    mk({ fullName: 'Admin AutoPark', email: 'admin@test.ma', role: 'admin' }),
    mk({ fullName: 'Mohammed Alami', email: 'owner1@test.ma', role: 'parking_owner' }),
    mk({ fullName: 'Karim Tazi', email: 'owner2@test.ma', role: 'parking_owner' }),
    mk({ fullName: 'Youssef Benali', email: 'tech@test.ma', role: 'technicien' }),
    mk({ fullName: 'Ahmed Sahraoui', email: 'ahmed@test.ma', role: 'user' }),
    mk({ fullName: 'Fatima Zahra', email: 'fatima@test.ma', role: 'user' }),
  ]);

  const [massira, centre, street] = await Promise.all([
    Parking.create({
      name: 'Parking Al Massira',
      ownerId: owner1._id,
      type: 'normal',
      location: { type: 'Point', coordinates: [-13.2033, 27.1536] },
      address: 'Avenue Mohammed V, Laâyoune',
      totalSpots: 6,
      pricePerHour: 8,
      commissionPercent: 15,
    }),
    Parking.create({
      name: 'Parking Centre Ville',
      ownerId: owner2._id,
      type: 'normal',
      location: { type: 'Point', coordinates: [-13.1989, 27.1502] },
      address: 'Place Dchira, Laâyoune',
      totalSpots: 4,
      pricePerHour: 10,
      commissionPercent: 12,
    }),
    Parking.create({
      name: 'Rue Al Kabir',
      ownerId: owner1._id,
      type: 'open_street',
      location: { type: 'Point', coordinates: [-13.1902, 27.1481] },
      address: 'Rue Al Kabir, Laâyoune',
      totalSpots: 5,
      pricePerHour: 5,
      commissionPercent: 8,
    }),
  ]);

  const token = (u) => u.generateToken();
  return {
    users: { admin, owner1, owner2, tech, ahmed, fatima },
    tokens: {
      admin: token(admin),
      owner1: token(owner1),
      owner2: token(owner2),
      tech: token(tech),
      ahmed: token(ahmed),
      fatima: token(fatima),
    },
    parkings: { massira, centre, street },
  };
};

const api = () => request(app);
const auth = (token) => ({ Authorization: `Bearer ${token}` });

/** A window relative to now, in hours. */
const window = (fromHours, toHours, base = Date.now()) => ({
  startTime: new Date(base + fromHours * HOUR).toISOString(),
  endTime: new Date(base + toHours * HOUR).toISOString(),
});

const book = (token, parking, spotNumber, win, carPlate = '12345-A-61') =>
  api()
    .post('/api/bookings')
    .set(auth(token))
    .send({ parkingId: String(parking._id), spotNumber, carPlate, ...win });

const spotsOf = async (parkingId) => (await Parking.findById(parkingId).lean()).spots;
const spotStatus = async (parkingId, n) => (await spotsOf(parkingId)).find((s) => s.spotNumber === n).status;

module.exports = {
  HOUR,
  api,
  auth,
  book,
  window,
  resetDatabase,
  disconnect,
  seedNetwork,
  spotsOf,
  spotStatus,
};
