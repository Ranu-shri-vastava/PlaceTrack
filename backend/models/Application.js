const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  jobRole: { type: String, required: true },
  appliedDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interview', 'selected', 'rejected', 'offer_accepted', 'offer_declined'],
    default: 'applied'
  },
  statusHistory: [{
    status: { type: String },
    date: { type: Date, default: Date.now },
    note: { type: String }
  }],
  resumeUsed: { type: String },
  coverLetter: { type: String },
  aptitudeScore: { type: Number },
  technicalScore: { type: Number },
  hrScore: { type: Number },
  offerLetterUrl: { type: String },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
