const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('../config/cloudinary');
const logger = require('./logger');

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

// Function to upload file to Cloudinary and return URL
const uploadToStorage = async (file) => {
  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'broker-management',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    });
    console.log('File uploaded to Cloudinary:', result);
    
    // Delete the local file after uploading to Cloudinary
    // try {
    //   await fs.unlink(file.path);
    // } catch (error) {
    //   logger.warn(`Failed to delete local file ${file.path}:`, error);
    // }
    
    return {
      url: result.secure_url,
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      publicId: result.public_id
    };
  } catch (error) {
    logger.error('Error uploading file to Cloudinary:', error);
    throw new Error('File upload failed');
  }
};

module.exports = {
  upload,
  uploadToStorage
}; 