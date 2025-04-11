const mongoose = require('mongoose');

const bankStatementSchema = new mongoose.Schema({
  bank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bank',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['csv', 'xml']
  },
  filePath: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  processedData: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bankStatementSchema.index({ bank: 1 });
bankStatementSchema.index({ uploadDate: 1 });
bankStatementSchema.index({ status: 1 });

const BankStatement = mongoose.model('BankStatement', bankStatementSchema);

module.exports = BankStatement; 