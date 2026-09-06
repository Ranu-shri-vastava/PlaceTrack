const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  batch: { type: String, required: true },
  cgpa: { type: Number, min: 0, max: 10 },
  skills: [{ type: String }],
  resume: { type: String }, // URL or file path
  profilePhoto: { type: String },
  address: { type: String },
  tenthMarks: { type: Number },
  twelfthMarks: { type: Number },
  backlogs: { type: Number, default: 0 },
  isEligible: { type: Boolean, default: true },
  placementStatus: {
    type: String,
    enum: ['not_placed', 'placed', 'internship', 'higher_studies'],
    default: 'not_placed'
  },
  linkedin: { type: String },
  github: { type: String },
  notes: { type: String },
}, { timestamps: true });

studentSchema.index({ name: 'text', email: 'text', rollNumber: 'text', department: 'text', skills: 'text' });

module.exports = mongoose.model('Student', studentSchema);
