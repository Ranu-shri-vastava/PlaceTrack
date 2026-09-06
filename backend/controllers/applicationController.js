const Application = require('../models/Application');
const Student = require('../models/Student');

// GET all applications with filters
exports.getApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, studentId, companyId, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (studentId) query.student = studentId;
    if (companyId) query.company = companyId;

    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .populate('student', 'name email rollNumber department cgpa profilePhoto')
      .populate('company', 'name logo industry type packageOffered')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: applications, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single application
exports.getApplication = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('student')
      .populate('company');
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create application
exports.createApplication = async (req, res) => {
  try {
    // Check duplicate
    const exists = await Application.findOne({ student: req.body.student, company: req.body.company, jobRole: req.body.jobRole });
    if (exists) return res.status(400).json({ success: false, message: 'Application already exists for this student-company-role' });

    const application = new Application({
      ...req.body,
      statusHistory: [{ status: 'applied', date: new Date(), note: 'Application submitted' }]
    });
    await application.save();
    res.status(201).json({ success: true, data: application, message: 'Application created successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT update application status (pipeline move)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    application.status = status;
    application.statusHistory.push({ status, date: new Date(), note: note || '' });
    await application.save();

    // If selected, update student placement status
    if (status === 'selected') {
      await Student.findByIdAndUpdate(application.student, { placementStatus: 'placed' });
    }

    res.json({ success: true, data: application, message: 'Application status updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT update application
exports.updateApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: application, message: 'Application updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE application
exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, message: 'Application deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET pipeline stats (Applied -> Interview -> Selected -> Rejected)
exports.getPipelineStats = async (req, res) => {
  try {
    const pipeline = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const result = { applied: 0, shortlisted: 0, interview: 0, selected: 0, rejected: 0, offer_accepted: 0, offer_declined: 0 };
    pipeline.forEach(p => { if (result.hasOwnProperty(p._id)) result[p._id] = p.count; });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
