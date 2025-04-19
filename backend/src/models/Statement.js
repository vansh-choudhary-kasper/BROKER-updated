const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  bankName: String,
  accountNumber: String
});

const companySummarySchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  commission: {
    type: Number,
    required: true,
    default: 0
  },
  transactions: [transactionSchema]
});

const statementSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['csv', 'xml'],
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  companySummaries: [companySummarySchema],
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  totalCommission: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'error'],
    default: 'pending'
  },
  error: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
statementSchema.index({ uploadDate: -1 });
statementSchema.index({ 'companySummaries.company': 1 });
statementSchema.index({ status: 1 });
statementSchema.index({ createdBy: 1 });

const Statement = mongoose.model('Statement', statementSchema);

module.exports = Statement; 