const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, admin } = require('../middleware/auth');
const validateRequest = require('../middleware/validator');
const {
  createBroker,
  getBrokers,
  getBrokerById,
  updateBroker,
  deleteBroker,
  addReferral,
  updateReferral,
  deleteReferral
} = require('../controllers/broker');

// Validation middleware
const brokerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('address').notEmpty().withMessage('Address is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

// Routes
router.post('/', protect, admin, brokerValidation, validateRequest, createBroker);
router.get('/', protect, getBrokers);
router.get('/:id', protect, getBrokerById);
router.put('/:id', protect, admin, brokerValidation, validateRequest, updateBroker);
router.delete('/:id', protect, admin, deleteBroker);

// Referral routes
router.post('/:id/referrals', protect, admin, [
  body('companyId').isMongoId().withMessage('Invalid company ID'),
  body('commission').isFloat({ min: 0 }).withMessage('Commission must be a positive number')
], validateRequest, addReferral);

router.put('/:id/referrals/:referralId', protect, admin, [
  body('status').optional().isIn(['pending', 'paid']).withMessage('Invalid status'),
  body('commission').optional().isFloat({ min: 0 }).withMessage('Commission must be a positive number')
], validateRequest, updateReferral);

router.delete('/:id/referrals/:referralId', protect, admin, deleteReferral);

module.exports = router; 