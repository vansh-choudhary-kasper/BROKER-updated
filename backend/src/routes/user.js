const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { protect } = require('../middleware/auth');

// Get user by ID
router.get('/:id', protect, userController.getUser);

// Update user (including slabs)
router.patch('/:id', protect, userController.updateUser);

module.exports = router; 