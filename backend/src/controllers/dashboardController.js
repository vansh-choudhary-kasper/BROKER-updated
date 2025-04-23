const Company = require('../models/Company');
const Bank = require('../models/Bank');
const Expense = require('../models/Expense');
const Broker = require('../models/Broker');

const getDashboardStats = async (req, res) => {
    try {
        console.log("fetching dashboard stats");
        // Get total companies count, type-wise counts, total brokers, and total accounts
        const [totalCompanies, companyTypeCounts, totalBrokers, totalAccounts, accountTypeCounts] = await Promise.all([
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
            Broker.countDocuments(),
            Bank.countDocuments(),
            Bank.aggregate([
                {
                    $group: {
                        _id: '$isActive',
                        count: { $sum: 1 }
                    }
                }
            ])
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

        // Convert account type counts array to object
        const accountTypes = accountTypeCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, { 
            savings: 0,
            current: 0,
            fixed: 0
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

        console.log("successfully fetched dashboard stats");
        console.log(accountTypes);
        res.json({
            success: true,
            totalCompanies,
            totalBrokers,
            totalAccounts,
            accountTypes,
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

module.exports = {
    getDashboardStats,
};