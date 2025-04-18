const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const bankController = require('../controllers/bank');
const bankStatementController = require('../controllers/bankStatement');
const validateRequest = require('../middleware/validator');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/fileUpload');

// Validation middleware
const bankValidation = [
    body('accountHolderName').notEmpty().withMessage('Account holder name is required'),
    body('accountNumber').notEmpty().withMessage('Account number is required'),
    body('ifscCode')
        .notEmpty().withMessage('IFSC code is required')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code format'),
    body('bankName').notEmpty().withMessage('Bank name is required'),
    body('branchName').notEmpty().withMessage('Branch name is required'),
    body('accountType')
        .isIn(['savings', 'current', 'fixed_deposit'])
        .withMessage('Valid account type is required (savings, current, or fixed_deposit)'),
    body('accountHolderPan')
        .notEmpty().withMessage('Account holder PAN is required')
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format'),
    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),
    body('balance')
        .optional()
        .isNumeric().withMessage('Balance must be a number'),
    body('openingBalance')
        .optional()
        .isNumeric().withMessage('Opening balance must be a number')
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

router.get('/:id', bankController.getBank);

router.put('/:id',
    bankValidation,
    validateRequest,
    upload.array('documents', 5),
    bankController.updateBank
);

router.delete('/:id', bankController.deleteBank);

// Document routes
router.post('/:id/documents',
    upload.array('documents', 5),
    bankController.addDocuments
);

router.delete('/:id/documents/:docId', bankController.removeDocument);

// Transaction routes
router.post('/:id/transactions', [
    body('type').isIn(['credit', 'debit']).withMessage('Transaction type must be credit or debit'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('date').isISO8601().withMessage('Invalid date format'),
    validateRequest
], bankController.addTransaction);

router.get('/:id/transactions', bankController.getTransactions);

// Toggle bank status
router.patch('/:id/toggle-status', bankController.toggleBankStatus);

// Bank Statement routes
router.post('/statements/upload',
    bankStatementController.uploadStatement
);

module.exports = router; 