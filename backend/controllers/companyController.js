const Company = require('../models/Company');
const Application = require('../models/Application');
const Placement = require('../models/Placement');

// GET all companies
exports.getCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 20, industry, type, status, search } = req.query;
    const query = {};
    if (industry) query.industry = industry;
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const total = await Company.countDocuments(query);
    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: companies, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single company with applicants
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const applications = await Application.find({ company: req.params.id })
      .populate('student', 'name email rollNumber department cgpa');
    const placements = await Placement.find({ company: req.params.id })
      .populate('student', 'name email rollNumber department');
    const stats = {
      totalApplicants: applications.length,
      selected: applications.filter(a => a.status === 'selected').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      placed: placements.length,
    };

    res.json({ success: true, data: { ...company.toObject(), applications, placements, stats } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create company
exports.createCompany = async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();
    res.status(201).json({ success: true, data: company, message: 'Company added successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT update company
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company, message: 'Company updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE company
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET company stats
exports.getCompanyStats = async (req, res) => {
  try {
    const total = await Company.countDocuments();
    const active = await Company.countDocuments({ status: 'active' });
    const upcoming = await Company.countDocuments({ status: 'upcoming' });
    const completed = await Company.countDocuments({ status: 'completed' });
    const byType = await Company.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
    const byIndustry = await Company.aggregate([{ $group: { _id: '$industry', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]);

    res.json({ success: true, data: { total, active, upcoming, completed, byType, byIndustry } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
