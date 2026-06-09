const Booking = require('../models/Booking');
const Parking = require('../models/Parking');
const LoyaltyPoints = require('../models/LoyaltyPoints');

// GET /api/owner/dashboard — stats for owner's parkings
exports.getDashboard = async (req, res) => {
  try {
    const parkings = await Parking.find({ ownerId: req.user._id });
    const parkingIds = parkings.map(p => p._id);

    if (parkingIds.length === 0) {
      return res.json({
        occupiedSpots: 0,
        totalSpots: 0,
        revenueToday: 0,
        revenueTotal: 0,
        revenueThisMonth: 0,
        bestSpot: null,
        reservationsToday: 0,
        reservationsThisMonth: 0,
        reservationsByDay: [],
        reservationsByHour: [],
        topLoyalUsers: [],
      });
    }

    // Spot counts
    let totalSpots = 0;
    let occupiedSpots = 0;
    parkings.forEach(p => {
      totalSpots += p.totalSpots;
      occupiedSpots += p.spots.filter(s => s.status !== 'available').length;
    });

    // Date ranges
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Revenue today
    const revTodayResult = await Booking.aggregate([
      { $match: { parkingId: { $in: parkingIds }, status: { $in: ['active', 'done'] }, createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const revenueToday = revTodayResult[0]?.total || 0;

    // Revenue total
    const revTotalResult = await Booking.aggregate([
      { $match: { parkingId: { $in: parkingIds }, status: { $in: ['active', 'done'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const revenueTotal = revTotalResult[0]?.total || 0;

    // Revenue this month
    const revMonthResult = await Booking.aggregate([
      { $match: { parkingId: { $in: parkingIds }, status: { $in: ['active', 'done'] }, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const revenueThisMonth = revMonthResult[0]?.total || 0;

    // Best spot
    const bestSpotResult = await Booking.aggregate([
      { $match: { parkingId: { $in: parkingIds } } },
      { $group: { _id: '$spotNumber', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const bestSpot = bestSpotResult[0] ? { spotNumber: bestSpotResult[0]._id, bookings: bestSpotResult[0].count } : null;

    // Reservations today
    const reservationsToday = await Booking.countDocuments({
      parkingId: { $in: parkingIds },
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    // Reservations this month
    const reservationsThisMonth = await Booking.countDocuments({
      parkingId: { $in: parkingIds },
      createdAt: { $gte: monthStart },
    });

    // Reservations by day of week
    const reservationsByDay = await Booking.aggregate([
      { $match: { parkingId: { $in: parkingIds } } },
      { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Reservations by hour
    const reservationsByHour = await Booking.aggregate([
      { $match: { parkingId: { $in: parkingIds } } },
      { $group: { _id: { $hour: '$startTime' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Top 3 loyal users
    const topLoyalUsers = await LoyaltyPoints.find({ parkingId: { $in: parkingIds } })
      .sort({ bookingCount: -1 })
      .limit(3)
      .populate('userId', 'fullName email');

    res.json({
      occupiedSpots,
      totalSpots,
      revenueToday,
      revenueTotal,
      revenueThisMonth,
      bestSpot,
      reservationsToday,
      reservationsThisMonth,
      reservationsByDay,
      reservationsByHour,
      topLoyalUsers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/owner/reservations — active + past + overtime reservations
exports.getReservations = async (req, res) => {
  try {
    const parkings = await Parking.find({ ownerId: req.user._id }).select('_id');
    const parkingIds = parkings.map(p => p._id);

    const now = new Date();

    // Active reservations
    const active = await Booking.find({
      parkingId: { $in: parkingIds },
      status: 'active',
    })
      .populate('userId', 'fullName email phone')
      .populate('parkingId', 'name')
      .sort({ startTime: -1 });

    // Completed reservations
    const completed = await Booking.find({
      parkingId: { $in: parkingIds },
      status: 'done',
    })
      .populate('userId', 'fullName email phone')
      .populate('parkingId', 'name')
      .sort({ endTime: -1 })
      .limit(50);

    // Overtime: active bookings where endTime has passed
    const overtime = await Booking.find({
      parkingId: { $in: parkingIds },
      status: 'active',
      endTime: { $lt: now },
    })
      .populate('userId', 'fullName email phone')
      .populate('parkingId', 'name')
      .sort({ endTime: 1 });

    res.json({ active, completed, overtime });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/owner/complaints — complaints for owner's parkings
exports.getComplaints = async (req, res) => {
  try {
    const parkings = await Parking.find({ ownerId: req.user._id }).select('_id');
    const parkingIds = parkings.map(p => p._id);
    const Complaint = require('../models/Complaint');

    const complaints = await Complaint.find({ parkingId: { $in: parkingIds } })
      .populate('userId', 'fullName email')
      .populate('parkingId', 'name')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
