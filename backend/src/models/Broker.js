const mongoose = require('mongoose');
const slabSchema = require('./SlabSchema');

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

  // Company reference
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false
  },

  // Bank accounts (multiple)
  bankDetails: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bank',
    required: false
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

  // Slabs
  slabs: [slabSchema],

  // Task payments tracking
  taskPayments: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    taskNumber: {
      type: String,
      required: true
    },
    commission: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    },
    paymentDate: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
brokerSchema.index({ 'taskPayments.taskId': 1 });
brokerSchema.index({ 'taskPayments.status': 1 });
brokerSchema.index({ company: 1 });
brokerSchema.index({ bankAccounts: 1 });

const Broker = mongoose.model('Broker', brokerSchema);

module.exports = Broker; 