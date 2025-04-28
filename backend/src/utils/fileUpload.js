const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const logger = require('./logger');

// Configure multer to use memory storage
const storage = multer.memoryStorage();

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
    // Convert buffer to base64
    const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    // Determine resource type and options
    let uploadOptions = {
      folder: 'broker-management',
      use_filename: true,
      unique_filename: true
    };

    // For PDFs, use specific settings to preserve the PDF format
    if (file.mimetype === 'application/pdf') {
      uploadOptions.resource_type = 'raw';
      // Add this to force Cloudinary to treat it as a PDF
      uploadOptions.format = 'pdf';
    } else {
      // For non-PDFs, continue using auto detection
      uploadOptions.resource_type = 'auto';
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Data, uploadOptions);

    return {
      url: result.secure_url,
      originalName: file.originalname,
      filename: file.originalname,
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