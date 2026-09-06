const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Placement = require('../models/Placement');

// Simple rule-based AI placement agent (no external API needed)
exports.chatWithAgent = async (req, res) => {
  try {
    const { message, context = [] } = req.body;
    const lowerMsg = message.toLowerCase();
    let response = '';
    let data = null;

    // Fetch live data for context
    const [totalStudents, placedStudents, totalCompanies, upcomingInterviews, totalPlacements, packageStats] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ placementStatus: 'placed' }),
      Company.countDocuments(),
      Interview.countDocuments({ status: 'scheduled', scheduledDate: { $gte: new Date() } }),
      Placement.countDocuments(),
      Placement.aggregate([{ $match: { type: 'full_time' } }, { $group: { _id: null, avg: { $avg: '$package.ctc' }, max: { $max: '$package.ctc' } } }])
    ]);

    const placementRate = totalStudents ? ((placedStudents / totalStudents) * 100).toFixed(1) : 0;
    const avgPackage = packageStats[0]?.avg?.toFixed(2) || 0;
    const maxPackage = packageStats[0]?.max || 0;

    // Intent detection & response
    if (lowerMsg.includes('placement rate') || lowerMsg.includes('kitne place')) {
      response = `📊 Current placement rate is **${placementRate}%**.\n- Total Students: ${totalStudents}\n- Placed Students: ${placedStudents}\n- Not Placed: ${totalStudents - placedStudents}`;
    }
    else if (lowerMsg.includes('package') || lowerMsg.includes('salary') || lowerMsg.includes('ctc')) {
      response = `💰 Package Statistics:\n- Average CTC: **${avgPackage} LPA**\n- Highest Package: **${maxPackage} LPA**\n\nTip: Use Reports page for detailed package distribution charts.`;
    }
    else if (lowerMsg.includes('interview') || lowerMsg.includes('upcoming')) {
      const interviews = await Interview.find({ status: 'scheduled', scheduledDate: { $gte: new Date() } })
        .populate('student', 'name').populate('company', 'name').sort({ scheduledDate: 1 }).limit(5);
      response = `📅 You have **${upcomingInterviews}** upcoming interviews.\n\nNext 5 interviews:\n` +
        interviews.map(i => `• ${i.student?.name} @ ${i.company?.name} — ${new Date(i.scheduledDate).toLocaleDateString()}`).join('\n');
      data = interviews;
    }
    else if (lowerMsg.includes('top company') || lowerMsg.includes('best company')) {
      const topCompanies = await Placement.aggregate([
        { $group: { _id: '$company', count: { $sum: 1 }, avgCTC: { $avg: '$package.ctc' } } },
        { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'co' } },
        { $unwind: '$co' },
        { $project: { name: '$co.name', count: 1, avgCTC: 1 } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      response = `🏆 Top Recruiting Companies:\n` + topCompanies.map((c, i) => `${i + 1}. ${c.name} — ${c.count} placements, Avg ${c.avgCTC?.toFixed(1)} LPA`).join('\n');
      data = topCompanies;
    }
    else if (lowerMsg.includes('not placed') || lowerMsg.includes('unplaced')) {
      const unplaced = await Student.find({ placementStatus: 'not_placed', isEligible: true }).select('name rollNumber department cgpa batch').limit(10);
      response = `⚠️ **${totalStudents - placedStudents}** eligible students are yet to be placed.\n\nTop eligible students needing attention:\n` +
        unplaced.map(s => `• ${s.name} (${s.rollNumber}) — ${s.department}, CGPA: ${s.cgpa}`).join('\n');
      data = unplaced;
    }
    else if (lowerMsg.includes('company') && (lowerMsg.includes('how many') || lowerMsg.includes('total') || lowerMsg.includes('kitni'))) {
      response = `🏢 **${totalCompanies}** companies are registered in the system.`;
    }
    else if (lowerMsg.includes('add student') || lowerMsg.includes('new student')) {
      response = `➕ To add a new student:\n1. Go to **Students** section in sidebar\n2. Click **"+ Add Student"** button\n3. Fill in all required details\n4. Click Save\n\nOr use the quick-add form from the Dashboard.`;
    }
    else if (lowerMsg.includes('add company') || lowerMsg.includes('new company')) {
      response = `🏢 To add a new company:\n1. Go to **Companies** section\n2. Click **"+ Add Company"**\n3. Fill in company details, package info, eligibility criteria\n4. Save the record`;
    }
    else if (lowerMsg.includes('report') || lowerMsg.includes('analytics') || lowerMsg.includes('statistics')) {
      response = `📈 Reports & Analytics available:\n• Department-wise placement rate\n• Batch-wise comparison\n• Package distribution (bracket-wise)\n• Company-wise hiring stats\n• Monthly placement trend\n• Top skills in demand\n\nGo to **Reports** section for detailed charts.`;
    }
    else if (lowerMsg.includes('help') || lowerMsg.includes('kya kar sakte') || lowerMsg.includes('features')) {
      response = `🤖 I'm your AI Placement Assistant! I can help with:\n\n• **Placement Stats** — "What is the placement rate?"\n• **Package Info** — "Show average package"\n• **Upcoming Interviews** — "Any interviews today?"\n• **Top Companies** — "Which companies hired most?"\n• **Unplaced Students** — "Show unplaced students"\n• **Navigation Help** — "How to add a student?"\n• **Reports** — "Show placement analytics"\n\nAsk me anything about placements! 🎓`;
    }
    else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('namaste')) {
      response = `👋 Namaste! I'm your AI Placement Agent.\n\nCurrent Snapshot:\n• 📊 Placement Rate: **${placementRate}%** (${placedStudents}/${totalStudents} students)\n• 💰 Avg Package: **${avgPackage} LPA**\n• 📅 Upcoming Interviews: **${upcomingInterviews}**\n• 🏢 Companies: **${totalCompanies}**\n\nKuch poochna ho? Type "help" for all features!`;
    }
    else if (lowerMsg.includes('summary') || lowerMsg.includes('overview') || lowerMsg.includes('status')) {
      response = `📋 **Placement Drive Summary**\n\n👨‍🎓 Students: ${totalStudents} | Placed: ${placedStudents} (${placementRate}%)\n🏢 Companies: ${totalCompanies}\n📝 Total Applications: ${await Application.countDocuments()}\n🎤 Total Interviews: ${await Interview.countDocuments()}\n🎉 Total Placements: ${totalPlacements}\n💰 Avg Package: ${avgPackage} LPA | Highest: ${maxPackage} LPA`;
    }
    else {
      response = `🤔 I didn't quite understand that. Here are some things you can ask:\n\n• "What is the placement rate?"\n• "Show upcoming interviews"\n• "Top recruiting companies"\n• "Show unplaced students"\n• "Average package statistics"\n• "Placement summary"\n\nType **"help"** for full list of features!`;
    }

    res.json({ success: true, response, data, timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Global search across students and companies
exports.globalSearch = async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q || q.trim().length < 2) return res.json({ success: true, data: { students: [], companies: [], applications: [] } });

    const searchRegex = new RegExp(q, 'i');
    let students = [], companies = [], applications = [];

    if (!type || type === 'students') {
      students = await Student.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { rollNumber: searchRegex }, { department: searchRegex }, { skills: searchRegex }]
      }).select('name email rollNumber department cgpa batch placementStatus profilePhoto').limit(10);
    }

    if (!type || type === 'companies') {
      companies = await Company.find({
        $or: [{ name: searchRegex }, { industry: searchRegex }, { location: searchRegex }, { jobRoles: searchRegex }]
      }).select('name industry type status logo location packageOffered').limit(10);
    }

    if (!type || type === 'applications') {
      applications = await Application.find({ jobRole: searchRegex })
        .populate('student', 'name rollNumber')
        .populate('company', 'name logo')
        .select('jobRole status appliedDate')
        .limit(10);
    }

    res.json({ success: true, data: { students, companies, applications } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
