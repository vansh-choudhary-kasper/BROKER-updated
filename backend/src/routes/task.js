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
    body('description').notEmpty().withMessage('Task description is required'),
    body('dueDate').isISO8601().withMessage('Invalid due date'),
    body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority level'),
    body('status').isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('assignedTo').isMongoId().withMessage('Invalid user ID'),
    body('company').isMongoId().withMessage('Invalid company ID')
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

// Task status routes
router.patch('/:id/status',
    body('status').isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
    validateRequest,
    taskController.updateTaskStatus
);

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