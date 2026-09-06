const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Placement = require('../models/Placement');

// GET full dashboard overview
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents, placedStudents, totalCompanies, activeCompanies,
      totalApplications, totalInterviews, upcomingInterviews, totalPlacements,
      recentApplications, recentPlacements, packageStats, pipeline
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ placementStatus: 'placed' }),
      Company.countDocuments(),
      Company.countDocuments({ status: 'active' }),
      Application.countDocuments(),
      Interview.countDocuments(),
      Interview.countDocuments({ status: 'scheduled', scheduledDate: { $gte: new Date() } }),
      Placement.countDocuments(),
      Application.find().sort({ createdAt: -1 }).limit(5).populate('student', 'name rollNumber profilePhoto').populate('company', 'name logo'),
      Placement.find().sort({ createdAt: -1 }).limit(5).populate('student', 'name rollNumber profilePhoto').populate('company', 'name logo'),
      Placement.aggregate([{ $match: { type: 'full_time' } }, { $group: { _id: null, avg: { $avg: '$package.ctc' }, max: { $max: '$package.ctc' }, min: { $min: '$package.ctc' } } }]),
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const pipelineMap = { applied: 0, shortlisted: 0, interview: 0, selected: 0, rejected: 0 };
    pipeline.forEach(p => { if (pipelineMap.hasOwnProperty(p._id)) pipelineMap[p._id] = p.count; });

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents, placedStudents,
          placementRate: totalStudents ? ((placedStudents / totalStudents) * 100).toFixed(1) : 0,
          totalCompanies, activeCompanies, totalApplications,
          totalInterviews, upcomingInterviews, totalPlacements,
          avgPackage: packageStats[0]?.avg?.toFixed(2) || 0,
          maxPackage: packageStats[0]?.max || 0,
        },
        pipeline: pipelineMap,
        recentApplications,
        recentPlacements,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET reports data
exports.getReports = async (req, res) => {
  try {
    const [deptWise, batchWise, companyWise, packageDist, monthlyPlacements, skillsDemand] = await Promise.all([
      // Department-wise placement
      Student.aggregate([
        { $group: { _id: '$department', total: { $sum: 1 }, placed: { $sum: { $cond: [{ $eq: ['$placementStatus', 'placed'] }, 1, 0] } } } },
        { $project: { department: '$_id', total: 1, placed: 1, rate: { $multiply: [{ $divide: ['$placed', '$total'] }, 100] } } },
        { $sort: { total: -1 } }
      ]),
      // Batch-wise
      Student.aggregate([
        { $group: { _id: '$batch', total: { $sum: 1 }, placed: { $sum: { $cond: [{ $eq: ['$placementStatus', 'placed'] }, 1, 0] } } } },
        { $sort: { _id: -1 } }
      ]),
      // Company-wise placements
      Placement.aggregate([
        { $group: { _id: '$company', count: { $sum: 1 }, avgCTC: { $avg: '$package.ctc' }, maxCTC: { $max: '$package.ctc' } } },
        { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'co' } },
        { $unwind: '$co' },
        { $project: { name: '$co.name', industry: '$co.industry', count: 1, avgCTC: 1, maxCTC: 1 } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ]),
      // Package distribution
      Placement.aggregate([
        { $bucket: { groupBy: '$package.ctc', boundaries: [0, 3, 5, 8, 12, 20, 50], default: '50+', output: { count: { $sum: 1 } } } }
      ]),
      // Monthly placement trend
      Placement.aggregate([
        { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 }, avgCTC: { $avg: '$package.ctc' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      // Top skills in demand
      Application.aggregate([
        { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'stu' } },
        { $unwind: '$stu' },
        { $unwind: '$stu.skills' },
        { $match: { status: 'selected' } },
        { $group: { _id: '$stu.skills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ])
    ]);

    res.json({ success: true, data: { deptWise, batchWise, companyWise, packageDist, monthlyPlacements, skillsDemand } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
