const Bank = require('../models/Bank');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class BankController {
    async createBank(req, res) {
        try {
            const bank = await Bank.create(req.body);
            return res.status(201).json(
                ApiResponse.created('Bank account created successfully', bank)
            );
        } catch (error) {
            logger.error('Create Bank Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async getBanks(req, res) {
        try {
            const { page = 1, limit = 10, isActive, accountType, search } = req.query;
            const query = {};

            // Handle isActive filter
            if (isActive !== undefined && isActive !== '') {
                query.isActive = isActive === 'true';
            }

            // Handle accountType filter
            if (accountType && accountType !== '') {
                query.accountType = accountType;
            }

            // Handle search
            if (search) {
                query.$or = [
                    { accountName: { $regex: search, $options: 'i' } },
                    { accountNumber: { $regex: search, $options: 'i' } },
                    { bankName: { $regex: search, $options: 'i' } }
                ];
            }

            console.log('Bank query:', query); // Debug log

            const banks = await Bank.find(query)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();

            const count = await Bank.countDocuments(query);

            return res.status(200).json(
                ApiResponse.success('Banks retrieved successfully', {
                    banks,
                    totalPages: Math.ceil(count / limit),
                    currentPage: page,
                    total: count
                })
            );
        } catch (error) {
            logger.error('Get Banks Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async getBank(req, res) {
        try {
            const bank = await Bank.findById(req.params.id);
            if (!bank) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank account not found')
                );
            }

            return res.status(200).json(
                ApiResponse.success('Bank account retrieved successfully', bank)
            );
        } catch (error) {
            logger.error('Get Bank Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async updateBank(req, res) {
        try {
            const bank = await Bank.findById(req.params.id);
            if (!bank) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank account not found')
                );
            }

            Object.assign(bank, req.body);
            await bank.save();

            return res.status(200).json(
                ApiResponse.success('Bank account updated successfully', bank)
            );
        } catch (error) {
            logger.error('Update Bank Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async deleteBank(req, res) {
        try {
            const bank = await Bank.findById(req.params.id);
            if (!bank) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank account not found')
                );
            }

            await Bank.deleteOne({ _id: req.params.id });

            return res.status(200).json(
                ApiResponse.success('Bank account deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Bank Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async addTransaction(req, res) {
        try {
            const bank = await Bank.findById(req.params.id);
            if (!bank) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank account not found')
                );
            }

            const { type, amount, description, reference, relatedTask, relatedExpense } = req.body;

            // Update balance based on transaction type
            if (type === 'credit') {
                bank.balance += amount;
            } else if (type === 'debit') {
                if (bank.balance < amount) {
                    return res.status(400).json(
                        ApiResponse.error('Insufficient balance')
                    );
                }
                bank.balance -= amount;
            }

            // Add transaction
            bank.transactions.push({
                type,
                amount,
                date: new Date(),
                description,
                reference,
                relatedTask,
                relatedExpense
            });

            await bank.save();

            return res.status(200).json(
                ApiResponse.success('Transaction added successfully', bank)
            );
        } catch (error) {
            logger.error('Add Transaction Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async getTransactions(req, res) {
        try {
            const { page = 1, limit = 10, startDate, endDate, type } = req.query;
            const bank = await Bank.findById(req.params.id);
            
            if (!bank) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank account not found')
                );
            }

            let transactions = bank.transactions;

            // Apply filters
            if (startDate && endDate) {
                transactions = transactions.filter(t => 
                    t.date >= new Date(startDate) && t.date <= new Date(endDate)
                );
            }
            if (type) {
                transactions = transactions.filter(t => t.type === type);
            }

            // Apply pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedTransactions = transactions.slice(startIndex, endIndex);

            return res.status(200).json(
                ApiResponse.success('Transactions retrieved successfully', {
                    transactions: paginatedTransactions,
                    totalPages: Math.ceil(transactions.length / limit),
                    currentPage: page
                })
            );
        } catch (error) {
            logger.error('Get Transactions Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async addDocument(req, res) {
        try {
            const bank = await Bank.findById(req.params.id);
            if (!bank) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank account not found')
                );
            }

            const { name, type, url } = req.body;
            bank.documents.push({
                name,
                type,
                url,
                uploadDate: new Date()
            });

            await bank.save();

            return res.status(200).json(
                ApiResponse.success('Document added successfully', bank)
            );
        } catch (error) {
            logger.error('Add Document Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async removeDocument(req, res) {
        try {
            const bank = await Bank.findById(req.params.id);
            if (!bank) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank account not found')
                );
            }

            const docIndex = bank.documents.findIndex(
                doc => doc._id.toString() === req.params.docId
            );

            if (docIndex === -1) {
                return res.status(404).json(
                    ApiResponse.notFound('Document not found')
                );
            }

            bank.documents.splice(docIndex, 1);
            await bank.save();

            return res.status(200).json(
                ApiResponse.success('Document removed successfully')
            );
        } catch (error) {
            logger.error('Remove Document Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async toggleBankStatus(req, res) {
        try {
            const bank = await Bank.findById(req.params.id);
            if (!bank) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank account not found')
                );
            }

            bank.isActive = !bank.isActive;
            await bank.save();

            return res.status(200).json(
                ApiResponse.success('Bank account status updated successfully', bank)
            );
        } catch (error) {
            logger.error('Toggle Bank Status Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async addDocuments(req, res) {
        try {
            const bank = await Bank.findById(req.params.id);
            if (!bank) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank account not found')
                );
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json(
                    ApiResponse.error('No documents provided')
                );
            }

            const newDocuments = req.files.map(file => ({
                name: file.originalname,
                type: file.mimetype,
                url: file.path,
                uploadDate: new Date()
            }));

            bank.documents = bank.documents || [];
            bank.documents.push(...newDocuments);
            await bank.save();

            return res.status(200).json(
                ApiResponse.success('Documents added successfully', bank.documents)
            );
        } catch (error) {
            logger.error('Add Documents Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async deleteDocument(req, res) {
        try {
            const bank = await Bank.findById(req.params.id);
            if (!bank) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank account not found')
                );
            }

            const documentIndex = bank.documents.findIndex(
                doc => doc._id.toString() === req.params.documentId
            );

            if (documentIndex === -1) {
                return res.status(404).json(
                    ApiResponse.notFound('Document not found')
                );
            }

            bank.documents.splice(documentIndex, 1);
            await bank.save();

            return res.status(200).json(
                ApiResponse.success('Document deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Document Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }
}

module.exports = new BankController(); 