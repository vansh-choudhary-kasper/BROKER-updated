const express = require('express');
const router = express.Router();
const { getDashboardStats, getProfitLoss } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// Protect all dashboard routes
router.use(protect);

// Get dashboard statistics
router.get('/stats', getDashboardStats);

// Get profit and loss data
router.get('/profit-loss', getProfitLoss);

module.exports = router; 