const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const bankController = require('../controllers/bank');
const validateRequest = require('../middleware/validator');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/fileUpload');

// Validation middleware
const bankValidation = [
    body('name').notEmpty().withMessage('Bank name is required'),
    body('accountNumber').notEmpty().withMessage('Account number is required'),
    body('ifscCode').notEmpty().withMessage('IFSC code is required'),
    body('branch').notEmpty().withMessage('Branch name is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('contactPerson').notEmpty().withMessage('Contact person is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number')
];

// Routes
router.use(authMiddleware); // Protect all bank routes

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

router.delete('/:id/documents/:documentId',
    bankController.deleteDocument
);

module.exports = router; 