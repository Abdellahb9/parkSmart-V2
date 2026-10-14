const Complaint = require('../models/Complaint');
const Parking = require('../models/Parking');
const { managesParking } = require('../utils/ownership');
const { serverError } = require('../utils/http');
const { paginate } = require('../utils/paginate');

// POST /api/complaints — submit complaint
exports.create = async (req, res) => {
  try {
    const { parkingId, message } = req.body;

    const complaint = await Complaint.create({
      userId: req.user._id,
      parkingId,
      message,
    });

    res.status(201).json(complaint);
  } catch (error) {
    serverError(res, error);
  }
};

// GET /api/complaints — user's complaints
exports.getUserComplaints = async (req, res) => {
  try {
    const complaints = await paginate(req, res, Complaint, { userId: req.user._id }, (q) =>
      q.populate('parkingId', 'name').sort({ createdAt: -1 })
    );

    res.json(complaints);
  } catch (error) {
    serverError(res, error);
  }
};

// GET /api/admin/complaints — all complaints (admin)
exports.getAll = async (req, res) => {
  try {
    const complaints = await paginate(req, res, Complaint, {}, (q) =>
      q.populate('userId', 'fullName email').populate('parkingId', 'name').sort({ createdAt: -1 })
    );

    res.json(complaints);
  } catch (error) {
    serverError(res, error);
  }
};

// GET /api/owner/complaints — complaints for owner's parkings
exports.getByParking = async (req, res) => {
  try {
    const Parking = require('../models/Parking');
    const ownerParkings = await Parking.find({ ownerId: req.user._id }).select('_id');
    const parkingIds = ownerParkings.map(p => p._id);

    const complaints = await paginate(req, res, Complaint, { parkingId: { $in: parkingIds } }, (q) =>
      q.populate('userId', 'fullName email phone').populate('parkingId', 'name').sort({ createdAt: -1 })
    );

    res.json(complaints);
  } catch (error) {
    serverError(res, error);
  }
};

// PATCH /api/complaints/:id/resolve — resolve a complaint
exports.resolve = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Role is checked by the route; this checks the complaint is actually
    // about a parking this owner owns.
    const parking = await Parking.findById(complaint.parkingId).select('ownerId').lean();
    if (!managesParking(parking, req.user)) {
      return res.status(403).json({ message: 'Not authorized to resolve this complaint' });
    }

    complaint.status = 'resolved';
    await complaint.save();
    await complaint.populate([
      { path: 'userId', select: 'fullName email' },
      { path: 'parkingId', select: 'name' },
    ]);

    res.json(complaint);
  } catch (error) {
    serverError(res, error);
  }
};
