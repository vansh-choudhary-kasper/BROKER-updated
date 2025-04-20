const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// Protect all dashboard routes
router.use(protect);

// Get dashboard statistics
router.get('/stats', getDashboardStats);

module.exports = router; 