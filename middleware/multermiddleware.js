const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = './upload';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Disk Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    const filename = `file-${Date.now()}-${baseName}${ext}`;
    callback(null, filename);
  }
});

// File Filter
const fileFilter = (req, file, callback) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Only PNG, JPEG, JPG, and PDF files are allowed.'));
  }
};

// Multer Config
const multerConfig = multer({
  storage,
  fileFilter
 
});

module.exports = multerConfig;
