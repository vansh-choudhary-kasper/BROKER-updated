const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const taskController = require('../controllers/task');
const validateRequest = require('../middleware/validator');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/fileUpload');

// Validation middleware
const taskValidation = [
    body('title').notEmpty().withMessage('Task title is required'),
    body('description').optional(),
    body('taskNumber').optional(),
    body('clientCompany').isMongoId().withMessage('Invalid client company ID'),
    body('providerCompany').isMongoId().withMessage('Invalid provider company ID'),
    body('helperBroker.broker').optional().isMongoId().withMessage('Invalid helper broker ID'),
    body('helperBroker.commission').optional().isFloat({ min: 0, max: 100 }).withMessage('Commission must be between 0 and 100'),
    body('helperBroker.status').optional().isIn(['pending', 'paid']).withMessage('Invalid helper broker status'),
    body('helperBroker.paymentDate').optional().isISO8601().withMessage('Invalid payment date format'),
    body('payment.amount').isFloat({ min: 0 }).withMessage('Payment amount must be positive'),
    body('payment.currency').optional().isString().withMessage('Currency must be a string')
];

// Routes
router.use(protect); // Protect all task routes

router.post('/',
    taskValidation,
    validateRequest,
    upload.array('attachments', 5),
    taskController.createTask
);

router.get('/', taskController.getTasks);

router.get('/:id', taskController.getTask);

router.put('/:id',
    taskValidation,
    validateRequest,
    upload.array('attachments', 5),
    taskController.updateTask
);

router.delete('/:id', taskController.deleteTask);

// Task comment routes
router.post('/:id/comments',
    body('comment').notEmpty().withMessage('Comment is required'),
    validateRequest,
    taskController.addComment
);

router.delete('/:id/comments/:commentId', taskController.deleteComment);

// Task attachment routes
router.post('/:id/attachments',
    upload.array('attachments', 5),
    taskController.addAttachments
);

router.delete('/:id/attachments/:attachmentId', taskController.deleteAttachment);

module.exports = router; 