const User = require('../models/User');
const Booking = require('../models/Booking');
const Parking = require('../models/Parking');

// GET /api/admin/users — all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/admin/users — create parking_owner or technicien
exports.createUser = async (req, res) => {
  try {
    const { fullName, email, password, phone, CNE, role } = req.body;

    if (!['parking_owner', 'technicien'].includes(role)) {
      return res.status(400).json({ message: 'Can only create parking_owner or technicien accounts' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      CNE,
      role,
    });

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      CNE: user.CNE,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/admin/reservations — all reservations system-wide
exports.getAllReservations = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'fullName email phone')
      .populate('parkingId', 'name address')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/admin/stats — dashboard statistics
exports.getStats = async (req, res) => {
  try {
    // Total revenue
    const revenueResult = await Booking.aggregate([
      { $match: { status: { $in: ['active', 'done'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Revenue per month (last 12 months)
    const revenuePerMonth = await Booking.aggregate([
      { $match: { status: { $in: ['active', 'done'] } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    // Total reservations
    const totalReservations = await Booking.countDocuments();

    // Number of partner parkings
    const totalParkings = await Parking.countDocuments();

    // Parkings with reservations today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const parkingsWithTodayBookings = await Booking.distinct('parkingId', {
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    // Best and worst performing parkings
    const parkingPerformance = await Booking.aggregate([
      { $match: { status: { $in: ['active', 'done'] } } },
      {
        $group: {
          _id: '$parkingId',
          totalRevenue: { $sum: '$totalPrice' },
          totalBookings: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    let bestParking = null;
    let worstParking = null;

    if (parkingPerformance.length > 0) {
      const bestParkingData = await Parking.findById(parkingPerformance[0]._id).select('name');
      bestParking = {
        name: bestParkingData?.name || 'Unknown',
        revenue: parkingPerformance[0].totalRevenue,
        bookings: parkingPerformance[0].totalBookings,
      };

      const worstParkingData = await Parking.findById(parkingPerformance[parkingPerformance.length - 1]._id).select('name');
      worstParking = {
        name: worstParkingData?.name || 'Unknown',
        revenue: parkingPerformance[parkingPerformance.length - 1].totalRevenue,
        bookings: parkingPerformance[parkingPerformance.length - 1].totalBookings,
      };
    }

    // Reservations by day of week
    const reservationsByDay = await Booking.aggregate([
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Peak hours
    const peakHours = await Booking.aggregate([
      {
        $group: {
          _id: { $hour: '$startTime' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Reservations today
    const reservationsToday = await Booking.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    res.json({
      totalRevenue,
      revenuePerMonth: revenuePerMonth.reverse(),
      totalReservations,
      reservationsToday,
      totalParkings,
      parkingsWithReservationsToday: parkingsWithTodayBookings.length,
      bestParking,
      worstParking,
      reservationsByDay,
      peakHours,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
