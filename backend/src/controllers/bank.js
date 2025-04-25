const Bank = require('../models/Bank');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class BankController {
    async createBank(req, res) {
        try {
            const { customFields, ...bankData } = req.body;

            bankData.createdBy = req.user.userId;

            const bank = await Bank.create({
                ...bankData,
                customFields: customFields || {}
            });

            return res.status(201).json(
                ApiResponse.created('Bank account created successfully', bank)
            );
        } catch (error) {
            logger.error('Create Bank Error:', error);
            return res.status(500).json(
                ApiResponse.serverError(error.message)
            );
        }
    }

    async getBanks(req, res) {
        try {
            const { page = 1, limit = 10, isActive, accountType, search, ownerType } = req.query;
            const query = {};

            // Handle isActive filter
            if (isActive !== undefined && isActive !== '') {
                query.isActive = isActive === 'true';
            }

            // Handle accountType filter
            if (accountType && accountType !== '') {
                query.accountType = accountType;
            }

            // Handle ownerType filter
            if (ownerType) {
                query.ownerType = ownerType;
            }

            query.createdBy = req.user.userId;

            // Handle search
            if (search) {
                query.$or = [
                    { accountHolderName: { $regex: search, $options: 'i' } },
                    { accountNumber: { $regex: search, $options: 'i' } },
                    { bankName: { $regex: search, $options: 'i' } }
                ];
            }

            const banks = await Bank.find(query)
                .populate('owner')
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

    async updateBank(req, res) {
        try {
            const { owner, ownerType, customFields, ...updateData } = req.body;
            const bank = await Bank.findById(req.params.id);

            if (!bank) {    
                return res.status(404).json(
                    ApiResponse.notFound('Bank account not found')
                );
            }

            if (bank.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized')
                );
            }

            // Only allow updating customFields, not owner or ownerType
            Object.assign(bank, {
                ...updateData,
                customFields: customFields || bank.customFields
            });

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

            if (bank.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized')
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

    async toggleBankStatus(req, res) {
        try {
            const bank = await Bank.findById(req.params.id);
            if (!bank) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank account not found')
                );
            }

            if (bank.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized')
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
}

module.exports = new BankController(); 