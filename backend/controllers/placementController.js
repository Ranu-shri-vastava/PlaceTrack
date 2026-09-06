const Placement = require('../models/Placement');
const Student = require('../models/Student');

// GET all placements
exports.getPlacements = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, companyId, department, batch } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (companyId) query.company = companyId;

    const total = await Placement.countDocuments(query);
    let placements = await Placement.find(query)
      .populate({ path: 'student', match: { ...(department && { department }), ...(batch && { batch }) }, select: 'name email rollNumber department batch cgpa profilePhoto' })
      .populate('company', 'name logo industry type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Filter out null student (from populate match)
    if (department || batch) placements = placements.filter(p => p.student);

    res.json({ success: true, data: placements, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single placement
exports.getPlacement = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id).populate('student').populate('company');
    if (!placement) return res.status(404).json({ success: false, message: 'Placement not found' });
    res.json({ success: true, data: placement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create placement
exports.createPlacement = async (req, res) => {
  try {
    const placement = new Placement(req.body);
    await placement.save();
    // Update student placement status
    await Student.findByIdAndUpdate(req.body.student, { placementStatus: req.body.type === 'internship' ? 'internship' : 'placed' });
    res.status(201).json({ success: true, data: placement, message: 'Placement recorded successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT update placement
exports.updatePlacement = async (req, res) => {
  try {
    const placement = await Placement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!placement) return res.status(404).json({ success: false, message: 'Placement not found' });
    res.json({ success: true, data: placement, message: 'Placement updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE placement
exports.deletePlacement = async (req, res) => {
  try {
    const placement = await Placement.findByIdAndDelete(req.params.id);
    if (!placement) return res.status(404).json({ success: false, message: 'Placement not found' });
    res.json({ success: true, message: 'Placement deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET placement analytics
exports.getPlacementStats = async (req, res) => {
  try {
    const total = await Placement.countDocuments();
    const fullTime = await Placement.countDocuments({ type: 'full_time' });
    const internships = await Placement.countDocuments({ type: 'internship' });

    const packageStats = await Placement.aggregate([
      { $match: { type: 'full_time' } },
      { $group: { _id: null, avg: { $avg: '$package.ctc' }, max: { $max: '$package.ctc' }, min: { $min: '$package.ctc' } } }
    ]);

    const byCompany = await Placement.aggregate([
      { $group: { _id: '$company', count: { $sum: 1 }, avgPackage: { $avg: '$package.ctc' } } },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'companyInfo' } },
      { $unwind: '$companyInfo' },
      { $project: { name: '$companyInfo.name', count: 1, avgPackage: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const packageBrackets = await Placement.aggregate([
      { $bucket: { groupBy: '$package.ctc', boundaries: [0, 3, 5, 8, 12, 20, 50], default: '50+', output: { count: { $sum: 1 } } } }
    ]);

    const monthlyTrend = await Placement.aggregate([
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        total, fullTime, internships,
        packageStats: packageStats[0] || { avg: 0, max: 0, min: 0 },
        byCompany, packageBrackets, monthlyTrend
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
