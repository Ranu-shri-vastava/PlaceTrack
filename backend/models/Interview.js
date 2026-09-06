const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  round: { type: Number, default: 1 },
  roundName: {
    type: String,
    enum: ['aptitude', 'technical_1', 'technical_2', 'hr', 'gd', 'case_study', 'final', 'other'],
    default: 'technical_1'
  },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String },
  duration: { type: Number }, // in minutes
  mode: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    default: 'offline'
  },
  venue: { type: String },
  meetingLink: { type: String },
  interviewerName: { type: String },
  interviewerEmail: { type: String },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'],
    default: 'scheduled'
  },
  result: {
    type: String,
    enum: ['pass', 'fail', 'pending', 'hold'],
    default: 'pending'
  },
  feedback: { type: String },
  score: { type: Number },
  notes: { type: String },
  reminderSent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
