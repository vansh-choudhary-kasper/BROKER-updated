const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

const securityMiddleware = [
    // Set security HTTP headers
    helmet(),
    
    // Data sanitization against XSS
    xss(),
    
    // Prevent parameter pollution
    hpp(),
    
    // Enable CORS
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization']
    })
];

module.exports = securityMiddleware; 