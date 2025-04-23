const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const securityMiddleware = require('./middleware/security');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/company');
const taskRoutes = require('./routes/task');
const bankRoutes = require('./routes/bank');
const expenseRoutes = require('./routes/expense');
const brokerRoutes = require('./routes/broker');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/user');
const todoRoutes = require('./routes/todo');
const statementRoutes = require('./routes/statementRoutes');
// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// Remove Morgan logging middleware
// app.use(morgan(morganFormat, { stream: logger.stream }));

app.use(rateLimiter);
app.use(securityMiddleware);

app.use('/', (req, res, next) => {
    console.log(req.originalUrl);
    next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/brokers', brokerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/statements', statementRoutes);
// Error handling
app.use(errorHandler);

// Handle unhandled routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

module.exports = app; 