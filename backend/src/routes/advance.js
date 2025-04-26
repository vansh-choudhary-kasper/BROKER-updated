const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const advanceController = require('../controllers/advance');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validator');

// Validation middleware
const createAdvanceValidation = [
    body('title').notEmpty().withMessage('Title is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('type').isIn(['given', 'received']).withMessage('Invalid advance type'),
    body('counterpartyType').isIn(['company', 'broker']).withMessage('Invalid counterparty type'),
    body('counterpartyId').isMongoId().withMessage('Invalid counterparty ID')
];

// Routes
router.post(
    '/',
    protect,
    createAdvanceValidation,
    validateRequest,
    advanceController.createAdvance
);

router.put(
    '/:id/toggle',
    protect,
    advanceController.toggleAdvance
);

router.get(
    '/',
    protect,
    advanceController.getUserAdvances
);

router.put(
    '/:id/update',
    protect,
    advanceController.updateAdvance 
);

module.exports = router; 