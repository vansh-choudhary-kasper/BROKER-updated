const Bank = require('../models/Bank');
const Broker = require('../models/Broker');
const Company = require('../models/Company');

// Create broker
exports.createBroker = async (req, res) => {
  try {
    const { bankDetails, ...brokerData } = req.body;
    const bankIds = [];

    brokerData.createdBy = req.user.userId;
    // forEach doesn't wait for async operations, use for...of instead
    for (const bank of bankDetails) {
      try {
        let bankData = await Bank.findOne({ accountNumber: bank.accountNumber });
        if (!bankData) {
          bank.createdBy = req.user.userId;
          bankData = await Bank.create(bank);
        } else if (bankData.createdBy.toString() !== req.user.userId) {
          continue;
        }
        bankIds.push({ _id: bankData._id });
      } catch (error) {
        console.error("Error processing bank:", error);
        throw error; // Re-throw to be caught by outer try-catch
      }
    }
    // Create broker with parsed data
    const broker = await Broker.create({
      ...brokerData,
      bankDetails: bankIds
    });

    res.status(201).json({
      success: true,
      data: broker
    });
  } catch (error) {
    console.error("Error in creating broker:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all brokers with pagination and search
exports.getBrokers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;

    // Build query
    const query = {};

    query.createdBy = req.user.userId;

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status.toLowerCase();
    }

    // Execute query with pagination
    const brokers = await Broker.find(query)
      .populate('bankDetails')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Broker.countDocuments(query);

    res.json({
      success: true,
      data: brokers,
      total,
      page: page * 1,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("error in get brokers", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update broker
exports.updateBroker = async (req, res) => {
  try {
    const { bankDetails, ...brokerData } = req.body;

    // First find the broker
    const broker = await Broker.findById(req.params.id);
    if (!broker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    if (broker.createdBy.toString() !== req.user.userId) {
      return res.status(403).json(
        ApiResponse.error('Unauthorized')
      );
    }

    // Update bank accounts
    if (bankDetails && bankDetails.length > 0) {
      // Clear existing bank accounts
      broker.bankDetails = [];

      // Create/update bank accounts
      for (let bank of bankDetails) {
        try {
          // Validate bank details
          if (!bank.accountNumber || !bank.bankName || !bank.accountHolderName) {
            throw new Error('Missing required bank details');
          }

          let bankAccount = await Bank.findOne({ accountNumber: bank.accountNumber });
          bank.createdBy = req.user.userId;
          if (!bankAccount) {
            bankAccount = await Bank.create(bank);
          } else if (bankAccount.createdBy.toString() !== req.user.userId) {
            continue;
          } else {
            // Update all fields from `bank` to `bankAccount`
            Object.assign(bankAccount, bank);
            await bankAccount.save();
          }

          broker.bankDetails.push(bankAccount._id);
        } catch (error) {
          console.error("Error in updating/creating bank account:", error);
          return res.status(400).json({
            success: false,
            message: `Error updating bank account: ${error.message}`
          });
        }
      }
    }

    // Update broker data
    Object.assign(broker, brokerData);

    // Save the updated broker
    await broker.save();

    // Fetch the updated broker with populated references
    const updatedBroker = await Broker.findById(broker._id)
      .populate({
        path: 'bankDetails',
        select: '-transactions' // Exclude sensitive transaction data
      })
      .populate('company');

    res.json({
      success: true,
      data: updatedBroker
    });
  } catch (error) {
    console.error("Error in updateBroker:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete broker
exports.deleteBroker = async (req, res) => {
  try {
    const broker = await Broker.findByIdAndDelete(req.params.id);
    const bankDetails = broker.bankDetails;
    for (let bank of bankDetails) {
      await Bank.findByIdAndDelete(bank._id);
    }

    if (!broker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    if (broker.createdBy.toString() !== req.user.userId) {
      return res.status(403).json(
        ApiResponse.error('Unauthorized')
      );
    }

    res.json({
      success: true,
      message: 'Broker deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};