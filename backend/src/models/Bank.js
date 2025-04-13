const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true
  },
  ifscCode: {
    type: String,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  branchName: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['savings', 'current', 'fixed_deposit'],
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadDate: Date
  }],
  transactions: [{
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    companyName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    }
  }],
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
bankSchema.index({ accountNumber: 1 });
bankSchema.index({ ifscCode: 1 });
bankSchema.index({ isActive: 1 });

const Bank = mongoose.model('Bank', bankSchema);

module.exports = Bank; 