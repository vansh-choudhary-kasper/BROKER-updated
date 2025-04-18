const Company = require('../models/Company');
const Bank = require('../models/Bank');
const Expense = require('../models/Expense');
const User = require('../models/User');

const getDashboardStats = async (req, res) => {
    try {
        // Get total companies count, type-wise counts, total brokers, and total accounts
        const [totalCompanies, companyTypeCounts, totalBrokers, totalAccounts] = await Promise.all([
            Company.countDocuments({ name: { $ne: 'other' } }),
            Company.aggregate([
                {
                    $match: { name: { $ne: 'other' } }
                },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 }
                    }
                }
            ]),
            User.countDocuments({ role: 'broker' }),
            Bank.countDocuments()
        ]);

        // Convert company type counts array to object
        const companyTypes = companyTypeCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {
            client: 0,
            provider: 0,
            both: 0
        });

        // Get current date and calculate start of month/year
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

        // Get monthly expenses and category-wise expenses
        const monthlyExpenses = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Get yearly expenses and category-wise expenses
        const yearlyExpenses = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: startOfYear }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Convert expenses arrays to object format
        const monthlyExpenseCategories = monthlyExpenses.reduce((acc, curr) => {
            acc[curr._id] = curr.total;
            return acc;
        }, {});

        const yearlyExpenseCategories = yearlyExpenses.reduce((acc, curr) => {
            acc[curr._id] = curr.total;
            return acc;
        }, {});

        // Calculate total expenses
        const totalMonthlyExpenses = Object.values(monthlyExpenseCategories).reduce((sum, amount) => sum + amount, 0);
        const totalYearlyExpenses = Object.values(yearlyExpenseCategories).reduce((sum, amount) => sum + amount, 0);

        res.json({
            success: true,
            totalCompanies,
            totalBrokers,
            totalAccounts,
            companyTypes,
            monthlyExpenses: {
                total: totalMonthlyExpenses,
                categories: monthlyExpenseCategories
            },
            yearlyExpenses: {
                total: totalYearlyExpenses,
                categories: yearlyExpenseCategories
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
};

const getProfitLoss = async (req, res) => {
    try {
        // Get date range from query params or use default (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Get all income and expenses within date range
        const expenses = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalExpense: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format response data
        const profitLossData = expenses.map(item => ({
            date: item._id,
            expense: item.totalExpense,
        }));

        res.json({
            success: true,
            data: profitLossData,
            dateRange: {
                start: startDate,
                end: endDate
            }
        });

    } catch (error) {
        console.error('Error fetching profit/loss data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profit/loss data',
            error: error.message
        });
    }
}

module.exports = {
    getDashboardStats,
    getProfitLoss
};