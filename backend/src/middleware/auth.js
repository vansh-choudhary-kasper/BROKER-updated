const jwt = require('jsonwebtoken');
const { JWT } = require('../config/constants');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies[JWT.COOKIE_NAME];
        
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

        // Refresh token if it's going to expire soon (e.g., within 24 hours)
        const tokenExp = decoded.exp * 1000; // Convert to milliseconds
        if (tokenExp - Date.now() < 24 * 60 * 60 * 1000) {
            const newToken = jwt.sign(
                { userId: decoded.userId, role: decoded.role },
                JWT.SECRET,
                { expiresIn: JWT.EXPIRES_IN }
            );
            
            res.cookie(JWT.COOKIE_NAME, newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Auth Middleware Error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

module.exports = authMiddleware; 