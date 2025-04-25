const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const bankController = require('../controllers/bank');
const validateRequest = require('../middleware/validator');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/fileUpload');

// Validation middleware
const bankValidation = [
    body('accountHolderName').notEmpty().withMessage('Account holder name is required'),
    body('accountNumber').notEmpty().withMessage('Account number is required'),
    body('ifscCode')
        .notEmpty().withMessage('IFSC code is required')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code format, IFSC format should be like ABCD0123456'),
    body('bankName').notEmpty().withMessage('Bank name is required'),
    body('branchName').notEmpty().withMessage('Branch name is required'),
    body('accountType')
        .isIn(['savings', 'current', 'fixed_deposit'])
        .withMessage('Valid account type is required (savings, current, or fixed_deposit)'),
    body('accountHolderPan')
        .notEmpty().withMessage('Account holder PAN is required')
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format, PAN format should be like ABCDE12345'),
    body('accountHolderAadhar')
        .notEmpty().withMessage('Account holder Aadhar is required')
        .matches(/^[0-9]{12}$/).withMessage('Invalid Aadhar format, Aadhar format should be like 123456789012'),
    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),
];

// Routes
router.use(protect); // Protect all bank routes

router.post('/',
    bankValidation,
    validateRequest,
    upload.array('documents', 5),
    bankController.createBank
);

router.get('/', bankController.getBanks);

router.put('/:id',
    bankValidation,
    validateRequest,
    upload.array('documents', 5),
    bankController.updateBank
);

router.delete('/:id', bankController.deleteBank);

// Toggle bank status
router.patch('/:id/toggle-status', bankController.toggleBankStatus);

module.exports = router; 