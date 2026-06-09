const Complaint = require('../models/Complaint');

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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/complaints — user's complaints
exports.getUserComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id })
      .populate('parkingId', 'name')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/admin/complaints — all complaints (admin)
exports.getAll = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('userId', 'fullName email')
      .populate('parkingId', 'name')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/owner/complaints — complaints for owner's parkings
exports.getByParking = async (req, res) => {
  try {
    const Parking = require('../models/Parking');
    const ownerParkings = await Parking.find({ ownerId: req.user._id }).select('_id');
    const parkingIds = ownerParkings.map(p => p._id);

    const complaints = await Complaint.find({ parkingId: { $in: parkingIds } })
      .populate('userId', 'fullName email phone')
      .populate('parkingId', 'name')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/complaints/:id/resolve — resolve a complaint
exports.resolve = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    ).populate('userId', 'fullName email').populate('parkingId', 'name');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
