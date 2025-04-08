const jwt = require('jsonwebtoken');
const { JWT } = require('../config/constants');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
    console.log("authMiddleware called");
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
        
        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }

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

module.exports = authMiddleware; 