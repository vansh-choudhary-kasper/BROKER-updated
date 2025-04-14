const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test the connection
const testConnection = async () => {
  try {
    await cloudinary.api.ping();
    logger.info('Cloudinary connection successful');
  } catch (error) {
    logger.error('Cloudinary connection failed:', error);
  }
};

testConnection();

module.exports = cloudinary; 