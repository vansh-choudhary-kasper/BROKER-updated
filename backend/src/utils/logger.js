const winston = require('winston');
const path = require('path');

// Custom format to filter sensitive information
const sensitiveDataFilter = winston.format((info) => {
    // Remove sensitive headers and information
    if (info.message && typeof info.message === 'string') {
        // Remove authorization headers
        info.message = info.message.replace(/Authorization: Bearer [^\s]+/g, 'Authorization: [REDACTED]');
        // Remove cookie information
        info.message = info.message.replace(/Cookie: [^\s]+/g, 'Cookie: [REDACTED]');
        // Remove query parameters that might contain sensitive data
        info.message = info.message.replace(/\?[^\s]+/g, '?[REDACTED]');
    }
    return info;
});

// Define log format
const logFormat = winston.format.combine(
    sensitiveDataFilter(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // Write all logs to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error'
        }),
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log')
        })
    ]
});

module.exports = logger; 