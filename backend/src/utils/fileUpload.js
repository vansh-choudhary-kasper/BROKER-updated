const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Function to upload file to storage and return URL
const uploadToStorage = async (file) => {
  try {
    // In a production environment, you would upload to a cloud storage service
    // For now, we'll just return the local path
    const relativePath = path.relative(path.join(__dirname, '../../'), file.path);
    const url = `/uploads/${path.basename(file.path)}`;
    
    return {
      url,
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('File upload failed');
  }
};

module.exports = {
  upload,
  uploadToStorage
}; 