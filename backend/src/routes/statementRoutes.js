const express = require('express');
const router = express.Router();
const statementController = require('../controllers/statementController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Upload a new statement
router.post('/upload', statementController.uploadStatement);

// Get all statements
router.get('/', statementController.getStatements);

// Get statement details
router.get('/:id', statementController.getStatementDetails);

module.exports = router; 