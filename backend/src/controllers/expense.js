const Expense = require('../models/Expense');
const Company = require('../models/Company');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class ExpenseController {
    async createExpense(req, res) {
        try {
            const {
                title,
                amount,
                date,
                category,
                description,
                company,
                status      
            } = req.body;

            // Verify company exists
            const companyExists = await Company.find({_id: company, createdBy: req.user.userId });
            if (!companyExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            // Create expense with receipts
            const receipts = req.files ? req.files.map(file => ({
                name: file.originalname,
                type: file.mimetype,
                url: file.path,
                uploadDate: new Date()
            })) : [];

            const expense = await Expense.create({
                title,
                amount,
                date,
                category,
                description,
                company,
                receipts,
                status,
                createdBy: req.user.userId  
            });

            // Update user's total amount
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json(
                    ApiResponse.notFound('User not found')
                );  
            }
            
            const numMonth = new Date(date).getMonth();
            const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
            const month = months[numMonth];
            const year = new Date(date).getFullYear().toString();
            const expenseAmount = parseFloat(amount);

            if (!user.totalAmount.has(year)) {
                user.totalAmount.set(year, new Map());
            }
            
            const yearMap = user.totalAmount.get(year);
            
            if (!yearMap.has(month)) {
                yearMap.set(month, 0);
            }
            
            if (status === 'approved') {
                yearMap.set(month, (yearMap.get(month) || 0) - (expenseAmount || 0));
            }
            
           await User.findByIdAndUpdate(user._id, { totalAmount: user.totalAmount }, { new: true });

            return res.status(201).json(
                ApiResponse.created('Expense created successfully', expense)
            );
        } catch (error) {
            logger.error('Create Expense Error:', error);
            return res.status(500).json(
                ApiResponse.serverError(error.message)
            );
        }
    }

    async getExpenses(req, res) {
        try {
            const { page = 1, limit = 10, startDate, endDate, category, company, search, status } = req.query;
            const query = {};

            if (startDate && endDate) {
                query.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }
            if (category) query.category = category;
            if (company) query.company = company;
            if (status) query.status = status;
            // Add search functionality
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            query.createdBy = req.user.userId;  

            const expenses = await Expense.find(query)
                .populate('company', 'name')
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();

            const count = await Expense.countDocuments(query);

            return res.status(200).json(
                ApiResponse.success('Expenses retrieved successfully', {
                    expenses,
                    totalPages: Math.ceil(count / limit),
                    currentPage: page,
                    total: count
                })
            );
        } catch (error) {
            logger.error('Get Expenses Error:', error);
            return res.status(500).json(
                ApiResponse.serverError(error.message)
            );
        }
    }

    async updateExpense(req, res) {
        try {
            const {
                title,
                amount,
                date,
                category,
                description,
                company,
                status
            } = req.body;

            const expense = await Expense.findById(req.params.id);
            if (!expense) {
                return res.status(404).json(
                    ApiResponse.notFound('Expense not found')
                );
            }

            if (expense.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized, you are not allowed to update this expense')
                );
            }

            // Verify company exists
            const companyExists = await Company.find({_id: company, createdBy: req.user.userId });
            if (!companyExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            // Update user's total amount
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json(
                    ApiResponse.notFound('User not found')
                );  
            }       

            // Update total amount for the month
            const numMonth = new Date(date).getMonth();
            const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
            const month = months[numMonth];
            const year = new Date(date).getFullYear().toString();
            const expenseAmount = parseFloat(amount);

            if (!user.totalAmount.has(year)) {
                user.totalAmount.set(year, new Map());
            }
            
            const yearMap = user.totalAmount.get(year);
            
            if (!yearMap.has(month)) {
                yearMap.set(month, 0);
            }

            if (status === 'approved' && expense.status !== 'approved') {
                // When approving a new expense, subtract it from total earnings
                yearMap.set(month, (yearMap.get(month) || 0) - (expenseAmount || 0));
            } else if (status !== 'approved' && expense.status === 'approved') {
                // When un-approving an expense, add back to total earnings
                yearMap.set(month, (yearMap.get(month) || 0) + (expense.amount || 0));
            } else if (status === 'approved' && expense.status === 'approved') {
                // When modifying an approved expense, adjust the difference
                // If new amount is higher, subtract more from earnings
                // If new amount is lower, add back the difference to earnings
                const currentEarnings = yearMap.get(month) || 0;
                const expenseDiff = (expenseAmount || 0) - (expense.amount || 0);
                yearMap.set(month, currentEarnings - expenseDiff);
            }
            
           await User.findByIdAndUpdate(user._id, { totalAmount: user.totalAmount }, { new: true });

            // Update expense details
            Object.assign(expense, {
                title,
                amount,
                date,
                category,
                description,
                company,
                status
            });

            // Add new receipts if any
            if (req.files && req.files.length > 0) {
                const newReceipts = req.files.map(file => ({
                    name: file.originalname,
                    type: file.mimetype,
                    url: file.path,
                    uploadDate: new Date()
                }));
                expense.receipts.push(...newReceipts);
            }

            await expense.save();

            return res.status(200).json(
                ApiResponse.success('Expense updated successfully', expense)
            );
        } catch (error) {
            logger.error('Update Expense Error:', error);
            return res.status(500).json(
                ApiResponse.serverError(error.message)
            );
        }
    }

    async deleteExpense(req, res) {
        try {
            const expense = await Expense.findByIdAndDelete(req.params.id);
            if (!expense) {
                return res.status(404).json(
                    ApiResponse.notFound('Expense not found')
                );
            }

            if (expense.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized, you are not allowed to delete this expense')
                );
            }

            return res.status(200).json(
                ApiResponse.success('Expense deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Expense Error:', error);
            return res.status(500).json(
                ApiResponse.serverError(error.message)
            );
        }
    }

    async updateExpenseStatus(req, res) {
        try {
            const { status } = req.body;
            const expense = await Expense.findById(req.params.id);
            
            if (!expense) {
                return res.status(404).json(
                    ApiResponse.notFound('Expense not found')
                );
            }

            if (expense.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized, you are not allowed to update the status of this expense')
                );
            }

            expense.status = status;
            await expense.save();

            return res.status(200).json(
                ApiResponse.success('Expense status updated successfully', expense)
            );
        } catch (error) {
            logger.error('Update Expense Status Error:', error);
            return res.status(500).json(
                ApiResponse.serverError(error.message)
            );
        }
    }
}

module.exports = new ExpenseController(); 