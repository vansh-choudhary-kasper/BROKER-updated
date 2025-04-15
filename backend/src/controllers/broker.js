const Broker = require('../models/Broker');
const Company = require('../models/Company');

// Create broker
exports.createBroker = async (req, res) => {
  try {
    const broker = await Broker.create(req.body);
    res.status(201).json({
      success: true,
      data: broker
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all brokers with pagination and search
exports.getBrokers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    
    // Build query
    const query = {};
    
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

// Get broker by ID
exports.getBrokerById = async (req, res) => {
  try {
    const broker = await Broker.findById(req.params.id);
    if (!broker) {
      return res.status(404).json({ message: 'Broker not found' });
    }
    res.json(broker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update broker
exports.updateBroker = async (req, res) => {
  try {
    const broker = await Broker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!broker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }
    
    res.json({
      success: true,
      data: broker
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete broker
exports.deleteBroker = async (req, res) => {
  try {
    const broker = await Broker.findByIdAndDelete(req.params.id);
    
    if (!broker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
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

// Add referral
exports.addReferral = async (req, res) => {
  try {
    const { companyId, commission } = req.body;
    
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const broker = await Broker.findById(req.params.id);
    if (!broker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    broker.referrals.push({
      company: companyId,
      date: new Date(),
      commission: commission,
      status: 'pending'
    });

    await broker.save();
    
    res.status(201).json({
      success: true,
      data: broker
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update referral
exports.updateReferral = async (req, res) => {
  try {
    const { status, commission } = req.body;
    
    const broker = await Broker.findById(req.params.id);
    if (!broker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    const referral = broker.referrals.id(req.params.referralId);
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    if (status) referral.status = status;
    if (commission) referral.commission = commission;

    await broker.save();
    
    res.json({
      success: true,
      data: broker
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete referral
exports.deleteReferral = async (req, res) => {
  try {
    const broker = await Broker.findById(req.params.id);
    if (!broker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    const referral = broker.referrals.id(req.params.referralId);
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    referral.remove();
    await broker.save();
    
    res.json({
      success: true,
      message: 'Referral deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 