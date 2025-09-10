const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNo: String,
  project: String,
  title: String,
  hours: Number
});

const dailyWorklogSchema = new mongoose.Schema({
  developer: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  hoursWorked: {
    type: Number,
    required: true
  },
  dailyTarget: {
    type: Number,
    default: 6
  },
  status: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  dayType: {
    type: String,
    enum: ['working', 'weekend', 'holiday'],
    required: true
  },
  tickets: [ticketSchema],
  reportPeriod: {
    startDate: Date,
    endDate: Date
  },
  hide: {
    type: String,
    enum: ['unblock', 'block'],
    default: 'unblock'
  },
  devstatus: {
    type: String,
    enum: ['notcomplete', 'completed'],
    default: 'notcomplete'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate entries for same developer and date
dailyWorklogSchema.index({ developer: 1, date: 1 }, { unique: true });

// Update the updatedAt field before saving
dailyWorklogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DailyWorklog', dailyWorklogSchema);