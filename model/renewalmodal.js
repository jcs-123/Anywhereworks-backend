// models/renewal.model.js
const mongoose = require('mongoose');

const RenewalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    project: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    renewalDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// Helpful indexes
RenewalSchema.index({ renewalDate: 1 });
RenewalSchema.index({ name: 1 });

module.exports = mongoose.model('Renewal', RenewalSchema);
