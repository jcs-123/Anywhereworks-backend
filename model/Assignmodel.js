const mongoose = require('mongoose');

// Define sub-schema for time extension requests
const timeRequestSchema = new mongoose.Schema({
  hours: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  responseNote: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); // prevent _id for each subdoc unless needed

// Main ticket schema
const ticketSchema = new mongoose.Schema({
  ticketNo: {
    type: Number,
    unique: true,
    index: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  expectedHours: {
    type: Number
  },
  file: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: 'Assigned'
  },
  assignedTo: {
    type: String,
    required: true
  },
  assignedBy: {
    type: String
  },completedTime: {
  type: Date
}
,
  assignedDate: {
    type: Date
  },
  ticketType: {
    type: String,
    enum: ['Development', 'Maintenance']
  },
  timeRequests: [timeRequestSchema] // embedded array of time requests
}, {
  timestamps: true
});

// Pre-save hook to auto-increment ticketNo and set assignedDate
ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastTicket = await this.constructor.findOne().sort({ ticketNo: -1 });
    this.ticketNo = lastTicket ? lastTicket.ticketNo + 1 : 1;

    if (!this.assignedDate) {
      this.assignedDate = new Date();
    }
  }
  next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
