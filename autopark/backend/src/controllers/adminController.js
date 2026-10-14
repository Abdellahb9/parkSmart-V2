const User = require('../models/User');
const Booking = require('../models/Booking');
const Parking = require('../models/Parking');
const { serverError } = require('../utils/http');
const { paginate } = require('../utils/paginate');
const { revokeAll } = require('../auth/tokens');
const realtime = require('../realtime/emit');

// GET /api/admin/users — all users
exports.getUsers = async (req, res) => {
  try {
    const users = await paginate(req, res, User, {}, (q) => q.sort({ createdAt: -1 }));
    res.json(users);
  } catch (error) {
    serverError(res, error);
  }
};

// PATCH /api/admin/users/:id/status — disable or re-enable an account.
//
// Disabling signs the account out everywhere at once: its refresh tokens are
// revoked, its access tokens stop matching tokenVersion, and its open sockets
// are closed. Nothing is deleted, so its history stays intact.
exports.setUserStatus = async (req, res) => {
  try {
    const isActive = req.body.isActive;
    if (String(req.params.id) === String(req.user._id) && isActive === false) {
      return res.status(400).json({ message: 'You cannot disable your own account' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { $set: { isActive } }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!isActive) {
      await revokeAll(user._id);
      realtime.disconnectUser(String(user._id));
    }

    res.json(user);
  } catch (error) {
    serverError(res, error);
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
    serverError(res, error);
  }
};

// GET /api/admin/reservations — all reservations system-wide
exports.getAllReservations = async (req, res) => {
  try {
    const bookings = await paginate(req, res, Booking, {}, (q) =>
      q.populate('userId', 'fullName email phone').populate('parkingId', 'name address').sort({ createdAt: -1 })
    );

    res.json(bookings);
  } catch (error) {
    serverError(res, error);
  }
};

// GET /api/admin/stats — dashboard statistics
//
// Optional ?from=&to= (ISO dates) scope every figure to a window and add a
// `previous` block for the equivalent window immediately before it, so the
// dashboard can show a trend. With no params the response is exactly what it
// has always been, so existing callers are unaffected.
exports.getStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    const start = from ? new Date(from) : null;
    const end = to ? new Date(to) : null;
    const hasRange =
      start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end;

    const window = hasRange ? { createdAt: { $gte: start, $lte: end } } : {};
    const paid = { status: { $in: ['active', 'done'] } };

    const sumRevenue = async (match) => {
      const r = await Booking.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]);
      return r[0]?.total || 0;
    };

    const totalRevenue = await sumRevenue({ ...paid, ...window });

    // Revenue per month (last 12 within the window, or overall)
    const revenuePerMonth = await Booking.aggregate([
      { $match: { ...paid, ...window } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    const totalReservations = await Booking.countDocuments(window);
    const totalParkings = await Parking.countDocuments();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const parkingsWithTodayBookings = await Booking.distinct('parkingId', {
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const parkingPerformance = await Booking.aggregate([
      { $match: { ...paid, ...window } },
      { $group: { _id: '$parkingId', totalRevenue: { $sum: '$totalPrice' }, totalBookings: { $sum: 1 } } },
      { $sort: { totalRevenue: -1 } },
    ]);

    let bestParking = null;
    let worstParking = null;

    if (parkingPerformance.length > 0) {
      const first = parkingPerformance[0];
      const last = parkingPerformance[parkingPerformance.length - 1];
      const [bestDoc, worstDoc] = await Promise.all([
        Parking.findById(first._id).select('name'),
        Parking.findById(last._id).select('name'),
      ]);
      bestParking = { name: bestDoc?.name || 'Unknown', revenue: first.totalRevenue, bookings: first.totalBookings };
      worstParking = { name: worstDoc?.name || 'Unknown', revenue: last.totalRevenue, bookings: last.totalBookings };
    }

    const reservationsByDay = await Booking.aggregate([
      ...(hasRange ? [{ $match: window }] : []),
      { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const peakHours = await Booking.aggregate([
      ...(hasRange ? [{ $match: window }] : []),
      { $group: { _id: { $hour: '$startTime' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const reservationsToday = await Booking.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } });

    const payload = {
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
    };

    if (hasRange) {
      const span = end.getTime() - start.getTime();
      const prevWindow = { createdAt: { $gte: new Date(start.getTime() - span), $lt: start } };
      payload.range = { from: start.toISOString(), to: end.toISOString() };
      payload.previous = {
        totalRevenue: await sumRevenue({ ...paid, ...prevWindow }),
        totalReservations: await Booking.countDocuments(prevWindow),
      };
    }

    res.json(payload);
  } catch (error) {
    serverError(res, error);
  }
};
