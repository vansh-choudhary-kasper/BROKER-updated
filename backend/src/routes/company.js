const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const companyController = require('../controllers/company');
const validateRequest = require('../middleware/validator');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/fileUpload');

// Validation middleware
const companyValidation = [
    body('name').notEmpty().withMessage('Company name is required'),
    body('registrationNumber').notEmpty().withMessage('Registration number is required'),
    body('gstNumber').notEmpty().withMessage('GST number is required'),
    body('panNumber').notEmpty().withMessage('PAN number is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('contactPerson').notEmpty().withMessage('Contact person is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number')
];

// Routes
router.use(authMiddleware); // Protect all company routes

router.post('/', 
    companyValidation,
    validateRequest,
    upload.array('documents', 5),
    companyController.createCompany
);

router.get('/', companyController.getCompanies);

router.get('/:id', companyController.getCompany);

router.put('/:id',
    companyValidation,
    validateRequest,
    upload.array('documents', 5),
    companyController.updateCompany
);

router.delete('/:id', companyController.deleteCompany);

// Document routes
router.post('/:id/documents',
    upload.array('documents', 5),
    companyController.addDocuments
);

router.delete('/:id/documents/:documentId',
    companyController.deleteDocument
);

module.exports = router; 