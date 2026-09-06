const Student = require('../models/Student');
const Application = require('../models/Application');
const Placement = require('../models/Placement');

// GET all students with filters & pagination
exports.getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, department, batch, placementStatus, search, cgpaMin, cgpaMax } = req.query;
    const query = {};
    if (department) query.department = department;
    if (batch) query.batch = batch;
    if (placementStatus) query.placementStatus = placementStatus;
    if (cgpaMin || cgpaMax) query.cgpa = { ...(cgpaMin && { $gte: Number(cgpaMin) }), ...(cgpaMax && { $lte: Number(cgpaMax) }) };
    if (search) query.$text = { $search: search };

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: students, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single student with applications & placement
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const applications = await Application.find({ student: req.params.id }).populate('company', 'name logo industry');
    const placements = await Placement.find({ student: req.params.id }).populate('company', 'name logo');

    res.json({ success: true, data: { ...student.toObject(), applications, placements } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create student
exports.createStudent = async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json({ success: true, data: student, message: 'Student added successfully' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Email or Roll Number already exists' });
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT update student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student, message: 'Student updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    // cascade delete applications
    await Application.deleteMany({ student: req.params.id });
    await Placement.deleteMany({ student: req.params.id });
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET student stats
exports.getStudentStats = async (req, res) => {
  try {
    const total = await Student.countDocuments();
    const placed = await Student.countDocuments({ placementStatus: 'placed' });
    const notPlaced = await Student.countDocuments({ placementStatus: 'not_placed' });
    const eligible = await Student.countDocuments({ isEligible: true });
    const byDept = await Student.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const byBatch = await Student.aggregate([
      { $group: { _id: '$batch', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);
    const avgCgpa = await Student.aggregate([{ $group: { _id: null, avg: { $avg: '$cgpa' } } }]);

    res.json({ success: true, data: { total, placed, notPlaced, eligible, placementRate: total ? ((placed / total) * 100).toFixed(1) : 0, byDept, byBatch, avgCgpa: avgCgpa[0]?.avg?.toFixed(2) || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
