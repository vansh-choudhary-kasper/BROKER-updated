const jwt = require('jsonwebtoken');
const { JWT } = require('../config/constants');
const logger = require('../utils/logger');

// Protect middleware - verifies JWT token
const protect = async (req, res, next) => {
    console.log("protect middleware called");
    try {
        // Check for token in Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }
        
        const token = authHeader.split(' ')[1];
        console.log(token);
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        const decoded = jwt.verify(token, JWT.SECRET);
        
        // No need to refresh token as we're using localStorage in the frontend
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Auth Middleware Error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};

// Admin middleware - checks if user has admin role
const admin = async (req, res, next) => {
    console.log("admin middleware called");
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }
        next();
    } catch (error) {
        logger.error('Admin Middleware Error:', error);
        res.status(403).json({ 
            success: false, 
            message: 'Admin access required' 
        });
    }
};

module.exports = { protect, admin }; 