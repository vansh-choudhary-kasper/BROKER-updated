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
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },

  // Business details
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  gstNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  panNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  // Bank details
  bankDetails: {
    accountNumber: {
      type: String,
      required: true
    },
    ifscCode: {
      type: String,
      required: true
    },
    bankName: {
      type: String,
      required: true
    },
    branchName: String
  },

  // Commission structure
  commissionStructure: {
    defaultRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 10
    },
    minimumCommission: {
      type: Number,
      required: true,
      min: 0,
      default: 1000
    }
  },

  // Broker relationships
  helperBrokers: [{
    broker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Broker',
      required: true
    },
    commissionShare: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date
  }],

  // Task tracking
  tasks: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'helper'],
      required: true
    },
    commission: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    },
    paymentDate: Date
  }],

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