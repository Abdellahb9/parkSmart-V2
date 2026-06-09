const Reward = require('../models/Reward');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const Parking = require('../models/Parking');

// GET /api/rewards — user's loyalty + available rewards
exports.getRewards = async (req, res) => {
  try {
    // Get user's loyalty points per parking
    const loyaltyPoints = await LoyaltyPoints.find({ userId: req.user._id })
      .populate('parkingId', 'name');

    // Get all rewards (global + parking-specific)
    const rewards = await Reward.find()
      .populate('parkingId', 'name');

    // Calculate which rewards are unlocked
    const loyaltyMap = {};
    loyaltyPoints.forEach(lp => {
      if (lp.parkingId) {
        loyaltyMap[lp.parkingId._id.toString()] = lp.bookingCount;
      }
    });

    const enrichedRewards = rewards.map(r => {
      let bookingCount = 0;
      if (r.parkingId) {
        bookingCount = loyaltyMap[r.parkingId._id.toString()] || 0;
      } else {
        // Global reward: use total bookings across all parkings
        bookingCount = loyaltyPoints.reduce((sum, lp) => sum + lp.bookingCount, 0);
      }

      return {
        ...r.toObject(),
        currentBookings: bookingCount,
        unlocked: bookingCount >= r.requiredBookings,
        progress: Math.min(100, Math.round((bookingCount / r.requiredBookings) * 100)),
      };
    });

    res.json({
      loyaltyPoints,
      rewards: enrichedRewards,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/owner/rewards — rewards for owner's parking
exports.getOwnerRewards = async (req, res) => {
  try {
    const parkings = await Parking.find({ ownerId: req.user._id }).select('_id');
    const parkingIds = parkings.map(p => p._id);

    const rewards = await Reward.find({
      $or: [
        { parkingId: { $in: parkingIds } },
        { parkingId: null },
      ],
    }).populate('parkingId', 'name');

    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/rewards — create reward (admin/owner)
exports.createReward = async (req, res) => {
  try {
    const { title, description, parkingId, requiredBookings, type } = req.body;

    const reward = await Reward.create({
      title,
      description,
      parkingId: parkingId || null,
      requiredBookings,
      type,
    });

    res.status(201).json(reward);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
