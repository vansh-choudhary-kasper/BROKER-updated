const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config/constants');

const rateLimiter = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        // Use IP address as the key for rate limiting
        return req.ip;
    }
});

module.exports = rateLimiter; 