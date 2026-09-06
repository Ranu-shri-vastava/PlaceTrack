const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  jobRole: { type: String, required: true },
  package: {
    ctc: { type: Number, required: true }, // in LPA
    inHand: { type: Number },
    currency: { type: String, default: 'INR' },
    bond: { type: Number, default: 0 }, // bond period in months
  },
  joiningDate: { type: Date },
  offerLetterDate: { type: Date },
  offerLetterUrl: { type: String },
  location: { type: String },
  type: {
    type: String,
    enum: ['full_time', 'internship', 'internship_ppo', 'part_time'],
    default: 'full_time'
  },
  status: {
    type: String,
    enum: ['offered', 'accepted', 'declined', 'joined', 'not_joined'],
    default: 'offered'
  },
  stipend: { type: Number }, // for internships per month
  duration: { type: Number }, // internship duration in months
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Placement', placementSchema);
