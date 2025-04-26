const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, admin } = require('../middleware/auth');
const validateRequest = require('../middleware/validator');
const {
  createBroker,
  getBrokers,
  updateBroker,
  deleteBroker,
} = require('../controllers/broker');

// Validation middleware
const brokerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('address.street').optional(),
  body('address.city').optional(),
  body('address.state').optional(),
  body('address.country').optional(),
  body('address.pincode').optional(),
  body('gstNumber').optional(),
  body('panNumber').optional({ checkFalsy: true }).matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Please enter a valid PAN number'),
  body('company').optional().isMongoId().withMessage('Invalid company ID'),
  body('bankAccounts').optional().isArray().withMessage('Bank accounts must be an array').notEmpty().withMessage('At least one bank account is required'),
  body('bankAccounts.*').optional().isMongoId().withMessage('Invalid bank account ID'),
  body('bankDetails.accountNumber').optional(),
  body('bankDetails.ifscCode').optional(),
  body('bankDetails.bankName').optional(),
  body('bankDetails.branchName').optional(),
  body('financialSummary.totalTasks').optional().isInt({ min: 0 }).withMessage('Total tasks must be a non-negative integer'),
  body('financialSummary.totalCommission').optional().isFloat({ min: 0 }).withMessage('Total commission must be a non-negative number'),
  body('financialSummary.pendingCommission').optional().isFloat({ min: 0 }).withMessage('Pending commission must be a non-negative number'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Status must be active, inactive, or suspended')
];

// Routes
router.post('/', protect, brokerValidation, validateRequest, createBroker);
router.get('/', protect, getBrokers);
router.put('/:id', protect, brokerValidation, validateRequest, updateBroker);
router.delete('/:id', protect, deleteBroker);

module.exports = router; 