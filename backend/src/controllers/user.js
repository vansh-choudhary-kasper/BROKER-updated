const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class UserController {
    async getUser(req, res) {
        try {
            const user = await User.findById(req.params.id).select('-password');
            if (!user) {
                return res.status(404).json(
                    ApiResponse.notFound('User not found')
                );
            }

            return res.status(200).json(user);
        } catch (error) {
            logger.error('Get User Error:', error);
            return res.status(500).json(
                ApiResponse.serverError('Failed to get user')
            );
        }
    }

    async updateUser(req, res) {
        try {
            let updates = req.body;
            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json(
                    ApiResponse.notFound('User not found')
                );
            }

            // If updating slabs, validate them
            if (updates.clientSlabs || updates.providerSlabs) {
                // Sort slabs by minAmount
                if (updates.clientSlabs) {
                    updates.clientSlabs = updates.clientSlabs.map(slab => ({    
                        ...slab,
                        minAmount: parseInt(slab.minAmount),
                        maxAmount: parseInt(slab.maxAmount)
                    }));
                    console.log(updates.clientSlabs);
                    updates.clientSlabs.sort((a, b) => a.minAmount - b.minAmount);
                    
                    // Validate client slabs
                    for (let i = 0; i < updates.clientSlabs.length - 1; i++) {
                        if (updates.clientSlabs[i].maxAmount + 1 !== updates.clientSlabs[i + 1].minAmount) {
                            console.error('Client slabs must be continuous without gaps or overlaps');
                            return res.status(400).json(
                                ApiResponse.error('Client slabs must be continuous without gaps or overlaps')
                            );
                        }
                    }
                }

                if (updates.providerSlabs) {
                    updates.providerSlabs = updates.providerSlabs.map(slab => ({
                        ...slab,
                        minAmount: parseInt(slab.minAmount),
                        maxAmount: parseInt(slab.maxAmount)
                    }));
                    console.log(updates.providerSlabs);
                    updates.providerSlabs.sort((a, b) => a.minAmount - b.minAmount);
                    
                    // Validate provider slabs
                    for (let i = 0; i < updates.providerSlabs.length - 1; i++) {
                        if (updates.providerSlabs[i].maxAmount + 1 !== updates.providerSlabs[i + 1].minAmount) {
                            console.error('Provider slabs must be continuous without gaps or overlaps');
                            return res.status(400).json(
                                ApiResponse.error('Provider slabs must be continuous without gaps or overlaps')
                            );
                        }
                    }
                }
            }

            updates.commission = parseFloat(updates.commission);
            // Update user
            Object.assign(user, updates);
            await user.save();

            // Remove password from response
            const userResponse = user.toObject();
            delete userResponse.password;

            return res.status(200).json(userResponse);
        } catch (error) {
            logger.error('Update User Error:', error);
            return res.status(500).json(
                ApiResponse.serverError('Failed to update user')
            );
        }
    }
}

module.exports = new UserController(); 