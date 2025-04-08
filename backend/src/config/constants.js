module.exports = {
    JWT: {
        SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
        EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
        COOKIE_NAME: process.env.JWT_COOKIE_NAME || 'auth_token'
    },
    RATE_LIMIT: {
        WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
        MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    FILE_UPLOAD: {
        MAX_SIZE: parseInt(process.env.FILE_UPLOAD_MAX_SIZE) || 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: (process.env.FILE_UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,application/pdf').split(','),
        UPLOAD_DIR: process.env.FILE_UPLOAD_DIR || 'uploads/'
    },
    VALIDATION: {
        PASSWORD_MIN_LENGTH: 8,
        GST_REGEX: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        PAN_REGEX: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        PHONE_REGEX: /^[6-9]\d{9}$/,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    BACKUP: {
        FREQUENCY: '0 0 * * *', // Daily at midnight
        RETENTION_DAYS: 30
    },
    EMAIL: {
        FROM: process.env.SMTP_FROM || 'noreply@brokermanagement.com',
        SUBJECT_PREFIX: '[Broker Management] '
    }
}; 