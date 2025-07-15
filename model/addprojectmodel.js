const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
  
    trim: true
  }
}, {
  timestamps: true // Optional: for createdAt and updatedAt tracking
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
