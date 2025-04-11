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
    body('accountName').notEmpty().withMessage('Account name is required'),
    body('accountNumber').notEmpty().withMessage('Account number is required'),
    body('ifscCode').notEmpty().withMessage('IFSC code is required'),
    body('bankName').notEmpty().withMessage('Bank name is required'),
    body('branchName').notEmpty().withMessage('Branch name is required'),
    body('accountType').isIn(['savings', 'current', 'fixed_deposit']).withMessage('Invalid account type'),
    body('address').notEmpty().withMessage('Address is required'),
    body('contactPerson').notEmpty().withMessage('Contact person is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number')
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
    upload.single('statement'),
    bankStatementController.uploadStatement
);

router.get('/:bankId/statements',
    bankStatementController.getBankStatements
);

router.get('/statements/:statementId/download',
    bankStatementController.downloadStatement
);

module.exports = router; 