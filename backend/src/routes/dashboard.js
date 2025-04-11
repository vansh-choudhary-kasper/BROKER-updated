const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');
const { protect } = require('../middleware/auth');

// Protect all dashboard routes
router.use(protect);

// Get profit and loss data
router.get('/profit-loss', dashboardController.getProfitLoss);

module.exports = router; 