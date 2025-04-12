const mongoose = require('mongoose');

const brokerSchema = new mongoose.Schema({
  // Basic information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },

  gstNumber: {
    type: String,
    trim: true
  },

  panNumber: {
    type: String,
    unique: true,
    trim: true
  },

  // Bank details
  bankDetails: {
    accountNumber: {
      type: String,
    },
    ifscCode: {
      type: String,
    },
    bankName: {
      type: String,
    },
    branchName: String
  },

  // Financial summary
  financialSummary: {
    totalTasks: {
      type: Number,
      default: 0
    },
    totalCommission: {
      type: Number,
      default: 0
    },
    pendingCommission: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
brokerSchema.index({ email: 1 });
brokerSchema.index({ gstNumber: 1 });
brokerSchema.index({ panNumber: 1 });
brokerSchema.index({ status: 1 });
brokerSchema.index({ 'financialSummary.totalCommission': 1 });

const Broker = mongoose.model('Broker', brokerSchema);

module.exports = Broker; 