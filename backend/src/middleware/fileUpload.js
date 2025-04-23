const multer = require('multer');
const { FILE_UPLOAD } = require('../config/constants');
const logger = require('../utils/logger');

// Configure storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
    // For bank statements, allow CSV and XML
    if (req.path.includes('/statements/upload')) {
        const allowedTypes = ['text/csv', 'application/xml', 'text/xml'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV and XML files are allowed.'), false);
        }
    } 
    // For other uploads, use the default allowed types
    else if (FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
    }
};

// Create multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: FILE_UPLOAD.MAX_SIZE
    }
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File size too large. Maximum size is ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`
            });
        }
        logger.error('Multer Error:', error);
        return res.status(400).json({
            success: false,
            message: `File upload error, ${error.message}`
        });
    }
    
    if (error) {
        logger.error('File Upload Error:', error);
        return res.status(400).json({
            success: false,
            message: `File upload error, ${error.message}`
        });
    }
    
    next();
};

module.exports = {
    upload,
    handleUploadError
}; 