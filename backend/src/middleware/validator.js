const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    console.log("errors", errors);
    if (!errors.isEmpty()) {
        logger.warn('Validation Error:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

module.exports = validateRequest; 