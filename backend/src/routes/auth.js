const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/auth');
const validateRequest = require('../middleware/validator');
const { protect } = require('../middleware/auth');

// Validation middleware
const loginValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
    // body('role').isIn(['admin']).withMessage('Invalid role')
];

// OTP validation middleware
const otpValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

// Routes
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);

// OTP routes
router.post('/send-otp', 
    body('email').isEmail().withMessage('Please enter a valid email'),
    validateRequest,
    authController.sendOTP
);
router.post('/verify-otp', otpValidation, validateRequest, authController.verifyOTP);
router.post('/resend-otp',
    body('email').isEmail().withMessage('Please enter a valid email'),
    validateRequest,
    authController.resendOTP
);

router.post('/forgot-password', 
    body('email').isEmail().withMessage('Please enter a valid email'),
    validateRequest,
    authController.forgotPassword
);

router.get('/verify-reset-token/:token', authController.verifyResetToken);
router.post('/reset-password',
    [
        body('token').notEmpty().withMessage('Token is required'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character')
    ],
    validateRequest,
    authController.resetPassword
);

// Get current user route
router.get('/me', protect, authController.getCurrentUser);

module.exports = router; 