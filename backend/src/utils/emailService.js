const nodemailer = require('nodemailer');
const logger = require('./logger');
const { EMAIL } = require('../config/constants');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendEmail(to, subject, html) {
        try {
            const mailOptions = {
                from: EMAIL.DEFAULT_FROM,
                to,
                subject: `${EMAIL.SUBJECT_PREFIX} ${subject}`,
                html
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info('Email sent successfully:', info.messageId);
            return true;
        } catch (error) {
            logger.error('Email sending failed:', error);
            return false;
        }
    }

    async sendWelcomeEmail(user) {
        const subject = 'Welcome to Broker Management System';
        const html = `
            <h1>Welcome ${user.name}!</h1>
            <p>Thank you for joining our Broker Management System.</p>
            <p>Your account has been successfully created.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
        `;

        return this.sendEmail(user.email, subject, html);
    }

    async sendPasswordResetEmail(user, resetToken) {
        const subject = 'Password Reset Request';
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const html = `
            <h1>Password Reset Request</h1>
            <p>You have requested to reset your password.</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
        `;

        return this.sendEmail(user.email, subject, html);
    }

    async sendVerificationEmail(user, verificationToken) {
        const subject = 'Email Verification';
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const html = `
            <h1>Verify Your Email</h1>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verifyUrl}">Verify Email</a>
            <p>If you didn't create an account, please ignore this email.</p>
        `;

        return this.sendEmail(user.email, subject, html);
    }
}

module.exports = new EmailService(); 