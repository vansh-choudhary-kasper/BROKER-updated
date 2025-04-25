const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const expenseController = require('../controllers/expense');
const validateRequest = require('../middleware/validator');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/fileUpload');

// Validation middleware
const expenseValidation = [
    body('title').notEmpty().withMessage('Expense title is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('date').isISO8601().withMessage('Invalid date'),
    body('category').notEmpty().withMessage('Category is required'),
    body('description').optional(),
    body('company').isMongoId().withMessage('Invalid company ID'),
    body('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
];

// Routes
router.use(protect); // Protect all expense routes

router.post('/',
    expenseValidation,
    validateRequest,
    upload.array('receipts', 5),
    expenseController.createExpense
);

router.get('/', expenseController.getExpenses);

router.put('/:id',
    expenseValidation,
    validateRequest,
    upload.array('receipts', 5),
    expenseController.updateExpense
);

router.delete('/:id', expenseController.deleteExpense);

// Update expense status
router.patch('/:id/status', [
    body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
    validateRequest
], expenseController.updateExpenseStatus);

module.exports = router; 