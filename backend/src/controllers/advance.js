const Advance = require('../models/Advance');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const Company = require('../models/Company');
const Broker = require('../models/Broker');
const User = require('../models/User');

// Utility to update user's totalAmount
async function updateUserTotalAmount(userId, amount, type) {
    const now = new Date();
    const year = now.getFullYear().toString();
    const monthNumber = (now.getMonth() + 1).toString().padStart(2, '0');
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const month = months[now.getMonth()];
    const user = await User.findById(userId);
    console.log(user.totalAmount);
    if (!user) return;
    if (!user.totalAmount.has(year)) {
        user.totalAmount.set(year, {});
    }
    const yearMap = user.totalAmount.get(year);
    let current = yearMap.get(month) || 0;
    current = Number(current);
    if (type === 'given') {
        current -= amount;
    } else if (type === 'received') {
        current += amount;
    }
    console.log(yearMap);
    yearMap.set(month, current);
    user.totalAmount.set(year, yearMap);
    // Convert Map to plain object
    const totalAmountObj = {};
    user.totalAmount.forEach((value, key) => {
        const yearObj = {};
        value.forEach((monthValue, monthKey) => {
            yearObj[monthKey] = monthValue;
        });
        totalAmountObj[key] = yearObj;
    });
    user.totalAmount = totalAmountObj;

    let use = await user.save();
    console.log(use.totalAmount);
}

class AdvanceController {
    // Create a new advance
    async createAdvance(req, res) {
        try {
            const { title, description, amount, type, counterpartyType, counterpartyId } = req.body;
            amount = Number(amount);

            // Set the ref for population
            const counterpartyTypeRef = counterpartyType === 'company' ? 'Company' : 'Broker';

            // Optionally, validate the counterparty exists
            let counterpartyDoc = null;
            if (counterpartyType === 'company') {
                counterpartyDoc = await Company.findById(counterpartyId);
            } else if (counterpartyType === 'broker') {
                counterpartyDoc = await Broker.findById(counterpartyId);
            }
            if (!counterpartyDoc) {
                return res.status(404).json(ApiResponse.notFound('Counterparty not found'));
            }

            // Create advance record
            const advance = new Advance({
                title,
                description,
                amount,
                type,
                initialType: type,
                counterpartyType,
                counterpartyTypeRef,
                counterpartyId,
                createdBy: req.user.userId
            });

            await advance.save();

            // Update user totalAmount
            await updateUserTotalAmount(req.user.userId, amount, type);

            return res.status(201).json(
                ApiResponse.success('Advance created successfully', advance)
            );
        } catch (error) {
            logger.error('Create Advance Error:', error);
            return res.status(500).json(
                ApiResponse.serverError('Failed to create advance: ' + error.message)
            );
        }
    }

    // Toggle advance status between given and received
    async toggleAdvance(req, res) {
        try {
            const { id } = req.params;
            const advance = await Advance.findById(id);

            if (!advance) {
                return res.status(404).json(
                    ApiResponse.notFound('Advance not found')
                );
            }

            const prevType = advance.type;
            // Toggle the type
            advance.type = advance.type === 'given' ? 'received' : 'given';
            // Do NOT update initialType here
            // Update status based on type and initialType
            advance.status = (advance.type === advance.initialType) ? 'active' : 'returned';
            advance.updatedBy = req.user.userId;
            advance.updatedAt = new Date();

            await advance.save();
            console.log(advance.createdBy);
            // Reverse previous, apply new
            await updateUserTotalAmount(advance.createdBy, advance.amount, advance.type);

            return res.status(200).json(
                ApiResponse.success('Advance status toggled successfully', advance)
            );
        } catch (error) {
            logger.error('Toggle Advance Error:', error);
            return res.status(500).json(
                ApiResponse.serverError('Failed to toggle advance: ' + error.message)
            );
        }
    }

    // Get all advances for the logged-in user (createdBy)
    async getUserAdvances(req, res) {
        try {
            const { type, status } = req.query;
            const query = {
                createdBy: req.user.userId
            };

            if (type) query.type = type;
            if (status) query.status = status;

            const advances = await Advance.find(query)
                .populate('counterpartyId')
                // .populate({
                //     path: 'counterpartyId',
                //     select: 'name email company',
                //     model: function(doc) {
                //         return doc.counterpartyTypeRef === 'Company' ? Company : Broker;
                //     }
                // })
                .sort({ createdAt: -1 });

            return res.status(200).json(
                ApiResponse.success('Advances retrieved successfully', advances)
            );
        } catch (error) {
            logger.error('Get User Advances Error:', error);
            return res.status(500).json(
                ApiResponse.serverError('Failed to get advances: ' + error.message)
            );
        }
    }

    // Update an advance
    async updateAdvance(req, res) {
        try {
            const { id } = req.params;
            let { title, description, amount, type, counterpartyType, counterpartyId } = req.body;
            amount = Number(amount);
            const counterpartyTypeRef = counterpartyType === 'company' ? 'Company' : 'Broker';

            // Optionally, validate the counterparty exists
            let counterpartyDoc = null;
            if (counterpartyType === 'company') {
                counterpartyDoc = await Company.findById(counterpartyId);
            } else if (counterpartyType === 'broker') {
                counterpartyDoc = await Broker.findById(counterpartyId);
            }
            if (!counterpartyDoc) {
                return res.status(404).json(ApiResponse.notFound('Counterparty not found'));
            }

            const advance = await Advance.findById(id);
            if (!advance) {
                return res.status(404).json(ApiResponse.notFound('Advance not found'));
            }

            const prevType = advance.type;
            const prevAmount = advance.amount
            advance.title = title;
            advance.description = description;
            advance.amount = amount;
            advance.type = type;
            // Do NOT update initialType here
            advance.counterpartyType = counterpartyType;
            advance.counterpartyTypeRef = counterpartyTypeRef;
            advance.counterpartyId = counterpartyId;
            // Update status based on type and initialType
            advance.status = (advance.type === advance.initialType) ? 'active' : 'returned';
            advance.updatedBy = req.user.userId;
            advance.updatedAt = new Date();

            await advance.save();

            // If type or amount changed, reverse previous and apply new
            if (type !== prevType || amount !== prevAmount) {
                await updateUserTotalAmount(advance.createdBy, prevAmount, prevType === 'given' ? 'received' : 'given');
                await updateUserTotalAmount(advance.createdBy, amount, type);
            }

            return res.status(200).json(
                ApiResponse.success('Advance updated successfully', advance)
            );
        } catch (error) {
            logger.error('Update Advance Error:', error);
            return res.status(500).json(
                ApiResponse.serverError('Failed to update advance: ' + error.message)
            );
        }
    }
}

module.exports = new AdvanceController(); 