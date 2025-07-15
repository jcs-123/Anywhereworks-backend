const Project = require('../model/addprojectmodel');

// Add a new project
exports.addProject = async (req, res) => {
  try {
    const { projectName } = req.body;

    if (!projectName) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const newProject = new Project({ projectName });
    await newProject.save();

    res.status(201).json({ message: 'Project added successfully', project: newProject });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Project name already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
