const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true },
  phone: { type: String },
  website: { type: String },
  industry: { type: String },
  description: { type: String },
  logo: { type: String },
  hrName: { type: String },
  hrEmail: { type: String },
  hrPhone: { type: String },
  location: { type: String },
  type: {
    type: String,
    enum: ['product', 'service', 'startup', 'mnc', 'psu', 'other'],
    default: 'other'
  },
  eligibilityCriteria: {
    minCGPA: { type: Number, default: 0 },
    maxBacklogs: { type: Number, default: 0 },
    departments: [{ type: String }],
    batch: [{ type: String }]
  },
  packageOffered: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  jobRoles: [{ type: String }],
  visitDate: { type: Date },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  notes: { type: String },
}, { timestamps: true });

companySchema.index({ name: 'text', industry: 'text', location: 'text', jobRoles: 'text' });

module.exports = mongoose.model('Company', companySchema);
