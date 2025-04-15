const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todo');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validator');

// Validation middleware
const todoValidation = [
    body('title').notEmpty().withMessage('Title is required'),
    body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('status').optional().isIn(['pending', 'in_progress', 'completed']).withMessage('Invalid status'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
];

// Routes
router.get('/', protect, todoController.getTodos);
router.post('/', protect, todoValidation, validateRequest, todoController.createTodo);
router.put('/:id', protect, validateRequest, todoController.updateTodo);
router.delete('/:id', protect, todoController.deleteTodo);

module.exports = router; 