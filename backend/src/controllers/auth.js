const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/email');

// Login controller
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
        // res user can access in frontend using re
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Register controller
exports.register = async (req, res) => {
    try {
        const { name, email, password, role = 'admin', phone = '1234567890' } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            name,
            email,
            password,
            role,
            phone
        });
        
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout controller
exports.logout = async (req, res) => {
    try {
        // In a real application, you might want to blacklist the token
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Refresh token controller
exports.refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token: newToken });
    } catch (error) {
        res.status(401).json({ message: `Invalid token, ${error.message}` });
    }
};

// Forgot password controller
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await sendPasswordResetEmail(email, resetUrl);
        
        res.json({ message: 'Password reset instructions sent to email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Verify reset token controller
exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;   
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }   

        res.json({ message: 'Reset token is valid' });
    } catch (error) {
        res.status(401).json({ message: `Invalid or expired token, ${error.message}` });
    }
};  

// Reset password controller
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password
        user.password = password;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(401).json({ message: `Invalid or expired token, ${error.message}` });
    }
};

// Get current user controller
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Generate OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Send OTP controller
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate OTP
        const otp = generateOTP();

        // Store OTP in memory (in production, use Redis or similar)
        global.otpStore = global.otpStore || {};
        global.otpStore[email] = {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
        };

        // Send OTP email
        await sendOTPEmail(email, otp);
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

// Verify OTP controller
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Check if OTP exists and is not expired
        if (!global.otpStore || !global.otpStore[email]) {
            return res.status(400).json({ message: 'OTP not found or expired' });
        }

        const storedOTP = global.otpStore[email];
        if (Date.now() > storedOTP.expiresAt) {
            delete global.otpStore[email];
            return res.status(400).json({ message: 'OTP expired' });
        }

        if (otp !== storedOTP.otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Clear OTP after successful verification
        delete global.otpStore[email];

        res.json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to verify OTP' });
    }
};

// Resend OTP controller
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate new OTP
        const otp = generateOTP();

        // Update OTP store
        global.otpStore = global.otpStore || {};
        global.otpStore[email] = {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
        };

        // Send new OTP email using the utility function
        await sendOTPEmail(email, otp);
        res.json({ message: 'New OTP sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to resend OTP' });
    }
}; 