const Bank = require('../models/Bank');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class DashboardController {
    async getProfitLoss(req, res) {
        try {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            // Get all banks
            const banks = await Bank.find({ isActive: true });

            // Initialize profit data
            const profitData = {
                monthly: [],
                yearly: [],
                currentMonth: 0,
                lastMonth: 0,
                currentYear: 0,
                lastYear: 0
            };

            // Calculate monthly profits for the last 12 months
            for (let i = 0; i < 12; i++) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthName = date.toLocaleString('default', { month: 'short' });
                
                let monthlyProfit = 0;
                banks.forEach(bank => {
                    bank.transactions.forEach(transaction => {
                        const transactionDate = new Date(transaction.date);
                        if (transactionDate.getMonth() === date.getMonth() && 
                            transactionDate.getFullYear() === date.getFullYear()) {
                            if (transaction.type === 'credit') {
                                monthlyProfit += transaction.amount;
                            } else {
                                monthlyProfit -= transaction.amount;
                            }
                        }
                    });
                });

                profitData.monthly.unshift({
                    month: monthName,
                    profit: monthlyProfit
                });

                // Store current and last month's profit
                if (i === 0) {
                    profitData.currentMonth = monthlyProfit;
                } else if (i === 1) {
                    profitData.lastMonth = monthlyProfit;
                }
            }

            // Calculate yearly profits for the last 5 years
            for (let i = 0; i < 5; i++) {
                const year = currentYear - i;
                let yearlyProfit = 0;
                let lastYearProfit = 0;

                banks.forEach(bank => {
                    bank.transactions.forEach(transaction => {
                        const transactionDate = new Date(transaction.date);
                        if (transactionDate.getFullYear() === year) {
                            if (transaction.type === 'credit') {
                                yearlyProfit += transaction.amount;
                            } else {
                                yearlyProfit -= transaction.amount;
                            }
                        }
                        if (transactionDate.getFullYear() === year - 1) {
                            if (transaction.type === 'credit') {
                                lastYearProfit += transaction.amount;
                            } else {
                                lastYearProfit -= transaction.amount;
                            }
                        }
                    });
                });

                profitData.yearly.unshift({
                    year: year.toString(),
                    currentYear: yearlyProfit,
                    lastYear: lastYearProfit
                });

                // Store current and last year's profit
                if (i === 0) {
                    profitData.currentYear = yearlyProfit;
                    profitData.lastYear = lastYearProfit;
                }
            }

            return res.status(200).json(
                ApiResponse.success('Profit and loss data retrieved successfully', profitData)
            );
        } catch (error) {
            logger.error('Get Profit Loss Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }
}

module.exports = new DashboardController(); 