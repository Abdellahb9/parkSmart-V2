require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Parking = require('./src/models/Parking');
const Booking = require('./src/models/Booking');
const Complaint = require('./src/models/Complaint');
const LoyaltyPoints = require('./src/models/LoyaltyPoints');
const Reward = require('./src/models/Reward');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Parking.deleteMany({}),
      Booking.deleteMany({}),
      Complaint.deleteMany({}),
      LoyaltyPoints.deleteMany({}),
      Reward.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ── Users ──────────────────────────────────────────────
    const admin = await User.create({
      fullName: 'Admin AutoPark',
      email: 'admin@autopark.ma',
      password: 'admin123',
      phone: '+212600000001',
      CNE: 'ADM001',
      role: 'admin',
    });

    const owner1 = await User.create({
      fullName: 'Mohammed Alami',
      email: 'owner1@autopark.ma',
      password: 'owner123',
      phone: '+212600000002',
      CNE: 'OWN001',
      role: 'parking_owner',
    });

    const tech1 = await User.create({
      fullName: 'Youssef Benali',
      email: 'tech1@autopark.ma',
      password: 'tech123',
      phone: '+212600000003',
      CNE: 'TEC001',
      role: 'technicien',
    });

    const user1 = await User.create({
      fullName: 'Ahmed Sahraoui',
      email: 'ahmed@autopark.ma',
      password: 'user123',
      phone: '+212600000004',
      CNE: 'USR001',
      role: 'user',
    });

    const user2 = await User.create({
      fullName: 'Fatima Zahra',
      email: 'fatima@autopark.ma',
      password: 'user123',
      phone: '+212600000005',
      CNE: 'USR002',
      role: 'user',
    });

    console.log('👤 Users created');

    // ── Parkings (Laayoune) ────────────────────────────────
    const parkingAlMassira = await Parking.create({
      name: 'Parking Al Massira',
      ownerId: owner1._id,
      type: 'normal',
      location: { type: 'Point', coordinates: [-13.2033, 27.1536] },
      address: 'Avenue Al Massira, Laâyoune',
      totalSpots: 20,
      pricePerHour: 8,
      pricePerDay: 60,
      commissionPercent: 15,
    });

    const parkingCentreVille = await Parking.create({
      name: 'Parking Centre Ville',
      ownerId: owner1._id,
      type: 'normal',
      location: { type: 'Point', coordinates: [-13.1985, 27.1502] },
      address: 'Centre Ville, Laâyoune',
      totalSpots: 20,
      pricePerHour: 10,
      pricePerDay: 80,
      commissionPercent: 12,
    });

    const parkingN5 = await Parking.create({
      name: 'Parking N5',
      ownerId: owner1._id,
      type: 'normal',
      location: { type: 'Point', coordinates: [-13.2010, 27.1478] },
      address: 'Route Nationale N5, Laâyoune',
      totalSpots: 40,
      pricePerHour: 6,
      pricePerDay: 45,
      commissionPercent: 10,
    });

    const rueAlKabir = await Parking.create({
      name: 'Rue Al Kabir',
      ownerId: owner1._id,
      type: 'open_street',
      location: { type: 'Point', coordinates: [-13.1950, 27.1520] },
      address: 'Rue Al Kabir, Laâyoune',
      totalSpots: 15,
      pricePerHour: 4,
      pricePerDay: 30,
      commissionPercent: 8,
    });

    const blvdHassanII = await Parking.create({
      name: 'Boulevard Hassan II',
      ownerId: owner1._id,
      type: 'open_street',
      location: { type: 'Point', coordinates: [-13.2005, 27.1545] },
      address: 'Boulevard Hassan II, Laâyoune',
      totalSpots: 20,
      pricePerHour: 4,
      pricePerDay: 30,
      commissionPercent: 8,
    });

    console.log('🅿️  Parkings created');

    // ── Sample Bookings ────────────────────────────────────
    const now = new Date();
    const bookings = [];

    // Active booking for user1
    const activeBooking = await Booking.create({
      userId: user1._id,
      parkingId: parkingAlMassira._id,
      spotNumber: 3,
      carPlate: '12345-A-1',
      startTime: new Date(now.getTime() - 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      totalHours: 3,
      totalPrice: 24,
      status: 'active',
    });
    bookings.push(activeBooking);

    // Mark spot 3 as reserved
    await Parking.findOneAndUpdate(
      { _id: parkingAlMassira._id, 'spots.spotNumber': 3 },
      { $set: { 'spots.$.status': 'reserved' } }
    );

    // Completed bookings for stats
    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const hour = 8 + Math.floor(Math.random() * 10);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysAgo);
      startDate.setHours(hour, 0, 0, 0);
      const endDate = new Date(startDate);
      const hours = 1 + Math.floor(Math.random() * 4);
      endDate.setHours(endDate.getHours() + hours);

      const parkingChoices = [parkingAlMassira, parkingCentreVille, parkingN5];
      const selectedParking = parkingChoices[Math.floor(Math.random() * parkingChoices.length)];
      const userChoices = [user1, user2];
      const selectedUser = userChoices[Math.floor(Math.random() * userChoices.length)];

      bookings.push(
        await Booking.create({
          userId: selectedUser._id,
          parkingId: selectedParking._id,
          spotNumber: 1 + Math.floor(Math.random() * selectedParking.totalSpots),
          carPlate: `${10000 + Math.floor(Math.random() * 90000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 99)}`,
          startTime: startDate,
          endTime: endDate,
          totalHours: hours,
          totalPrice: hours * selectedParking.pricePerHour,
          status: 'done',
          createdAt: startDate,
        })
      );
    }

    console.log(`📋 ${bookings.length} bookings created`);

    // ── Loyalty Points ─────────────────────────────────────
    await LoyaltyPoints.create([
      { userId: user1._id, parkingId: parkingAlMassira._id, bookingCount: 7 },
      { userId: user1._id, parkingId: parkingCentreVille._id, bookingCount: 3 },
      { userId: user2._id, parkingId: parkingAlMassira._id, bookingCount: 5 },
      { userId: user2._id, parkingId: parkingN5._id, bookingCount: 2 },
    ]);

    console.log('⭐ Loyalty points created');

    // ── Rewards ────────────────────────────────────────────
    await Reward.create([
      {
        title: 'Réservation gratuite',
        description: 'Obtenez une réservation gratuite après 5 réservations',
        parkingId: null, // global
        requiredBookings: 5,
        type: 'free_reservation',
      },
      {
        title: 'Bon Marjane 50 DH',
        description: 'Bon d\'achat Marjane de 50 DH après 10 réservations',
        parkingId: parkingAlMassira._id,
        requiredBookings: 10,
        type: 'discount_coupon',
      },
      {
        title: 'Lavage auto gratuit',
        description: 'Lavage auto gratuit après 8 réservations',
        parkingId: parkingCentreVille._id,
        requiredBookings: 8,
        type: 'free_wash',
      },
      {
        title: 'Vidange gratuite',
        description: 'Vidange gratuite après 12 réservations',
        parkingId: parkingN5._id,
        requiredBookings: 12,
        type: 'free_vidange',
      },
    ]);

    console.log('🎁 Rewards created');

    // ── Sample Complaints ──────────────────────────────────
    await Complaint.create([
      {
        userId: user1._id,
        parkingId: parkingAlMassira._id,
        message: 'Le parking n\'est pas bien éclairé la nuit. Problème de sécurité.',
        status: 'open',
      },
      {
        userId: user2._id,
        parkingId: parkingCentreVille._id,
        message: 'Place numéro 5 toujours occupée par le même véhicule sans réservation.',
        status: 'resolved',
      },
    ]);

    console.log('📝 Complaints created');

    console.log('\n✅ Seed completed successfully!');
    console.log('─────────────────────────────');
    console.log('Login credentials:');
    console.log('  Admin:          admin@autopark.ma / admin123');
    console.log('  Parking Owner:  owner1@autopark.ma / owner123');
    console.log('  Technicien:     tech1@autopark.ma / tech123');
    console.log('  User:           ahmed@autopark.ma / user123');
    console.log('  User:           fatima@autopark.ma / user123');
    console.log('─────────────────────────────');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
