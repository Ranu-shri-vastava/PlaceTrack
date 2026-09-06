const Interview = require('../models/Interview');

// GET all interviews
exports.getInterviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, result, studentId, companyId, date } = req.query;
    const query = {};
    if (status) query.status = status;
    if (result) query.result = result;
    if (studentId) query.student = studentId;
    if (companyId) query.company = companyId;
    if (date) {
      const d = new Date(date);
      query.scheduledDate = { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) };
    }

    const total = await Interview.countDocuments(query);
    const interviews = await Interview.find(query)
      .populate('student', 'name email rollNumber department cgpa profilePhoto')
      .populate('company', 'name logo industry')
      .populate('application', 'jobRole status')
      .sort({ scheduledDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: interviews, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET upcoming interviews (next 7 days)
exports.getUpcomingInterviews = async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const interviews = await Interview.find({
      scheduledDate: { $gte: now, $lte: nextWeek },
      status: 'scheduled'
    })
      .populate('student', 'name email rollNumber profilePhoto')
      .populate('company', 'name logo')
      .sort({ scheduledDate: 1 });
    res.json({ success: true, data: interviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single interview
exports.getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('student')
      .populate('company')
      .populate('application');
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, data: interview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create interview
exports.createInterview = async (req, res) => {
  try {
    const interview = new Interview(req.body);
    await interview.save();
    res.status(201).json({ success: true, data: interview, message: 'Interview scheduled successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT update interview
exports.updateInterview = async (req, res) => {
  try {
    const interview = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, data: interview, message: 'Interview updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE interview
exports.deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findByIdAndDelete(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, message: 'Interview deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET interview stats
exports.getInterviewStats = async (req, res) => {
  try {
    const total = await Interview.countDocuments();
    const scheduled = await Interview.countDocuments({ status: 'scheduled' });
    const completed = await Interview.countDocuments({ status: 'completed' });
    const passed = await Interview.countDocuments({ result: 'pass' });
    const failed = await Interview.countDocuments({ result: 'fail' });
    const byRound = await Interview.aggregate([{ $group: { _id: '$roundName', count: { $sum: 1 } } }]);
    res.json({ success: true, data: { total, scheduled, completed, passed, failed, passRate: completed ? ((passed / completed) * 100).toFixed(1) : 0, byRound } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
