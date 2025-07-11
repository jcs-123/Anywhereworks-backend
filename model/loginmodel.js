const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['employee', 'manager'],
  },
  mode: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  gmail: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    // Optional: add minlength or hash in production
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;
