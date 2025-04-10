const Expense = require('../models/Expense');
const Company = require('../models/Company');
const Bank = require('../models/Bank');
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
                bank
            } = req.body;

            // Verify company exists
            const companyExists = await Company.findById(company);
            if (!companyExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            // Verify bank exists
            const bankExists = await Bank.findById(bank);
            if (!bankExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank not found')
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
                bank,
                receipts,
                createdBy: req.user.userId
            });

            return res.status(201).json(
                ApiResponse.created('Expense created successfully', expense)
            );
        } catch (error) {
            logger.error('Create Expense Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async getExpenses(req, res) {
        try {
            const { page = 1, limit = 10, startDate, endDate, category, company, search } = req.query;
            const query = {};

            if (startDate && endDate) {
                query.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }
            if (category) query.category = category;
            if (company) query.company = company;
            
            // Add search functionality
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const expenses = await Expense.find(query)
                .populate('company', 'name')
                .populate('bank', 'bankName')
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
                ApiResponse.serverError()
            );
        }
    }

    async getExpense(req, res) {
        try {
            const expense = await Expense.findById(req.params.id)
                .populate('company', 'name')
                .populate('bank', 'name');

            if (!expense) {
                return res.status(404).json(
                    ApiResponse.notFound('Expense not found')
                );
            }

            return res.status(200).json(
                ApiResponse.success('Expense retrieved successfully', expense)
            );
        } catch (error) {
            logger.error('Get Expense Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
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
                bank
            } = req.body;

            const expense = await Expense.findById(req.params.id);
            if (!expense) {
                return res.status(404).json(
                    ApiResponse.notFound('Expense not found')
                );
            }

            // Verify company exists
            const companyExists = await Company.findById(company);
            if (!companyExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            // Verify bank exists
            const bankExists = await Bank.findById(bank);
            if (!bankExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank not found')
                );
            }

            // Update expense details
            Object.assign(expense, {
                title,
                amount,
                date,
                category,
                description,
                company,
                bank
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
                ApiResponse.serverError()
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

            return res.status(200).json(
                ApiResponse.success('Expense deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Expense Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async addReceipts(req, res) {
        try {
            const expense = await Expense.findById(req.params.id);
            if (!expense) {
                return res.status(404).json(
                    ApiResponse.notFound('Expense not found')
                );
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json(
                    ApiResponse.error('No receipts provided')
                );
            }

            const newReceipts = req.files.map(file => ({
                name: file.originalname,
                type: file.mimetype,
                url: file.path,
                uploadDate: new Date()
            }));

            expense.receipts.push(...newReceipts);
            await expense.save();

            return res.status(200).json(
                ApiResponse.success('Receipts added successfully', expense.receipts)
            );
        } catch (error) {
            logger.error('Add Receipts Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async deleteReceipt(req, res) {
        try {
            const expense = await Expense.findById(req.params.id);
            if (!expense) {
                return res.status(404).json(
                    ApiResponse.notFound('Expense not found')
                );
            }

            const receiptIndex = expense.receipts.findIndex(
                receipt => receipt._id.toString() === req.params.receiptId
            );

            if (receiptIndex === -1) {
                return res.status(404).json(
                    ApiResponse.notFound('Receipt not found')
                );
            }

            expense.receipts.splice(receiptIndex, 1);
            await expense.save();

            return res.status(200).json(
                ApiResponse.success('Receipt deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Receipt Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
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

            expense.status = status;
            await expense.save();

            return res.status(200).json(
                ApiResponse.success('Expense status updated successfully', expense)
            );
        } catch (error) {
            logger.error('Update Expense Status Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }
}

module.exports = new ExpenseController(); 