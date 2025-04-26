const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema({
  // Basic information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['given', 'received'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'returned'],
    default: 'active'
  },
  
  // Counterparty (company or broker)
  counterpartyType: {
    type: String,
    enum: ['company', 'broker'],
    required: true
  },
  counterpartyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'counterpartyTypeRef'
  },
  // This virtual field tells mongoose which model to use for population
  counterpartyTypeRef: {
    type: String,
    required: true,
    enum: ['Company', 'Broker']
  },
  
  // Transaction dates
  givenDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  returnDate: {
    type: Date
  },
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  initialType: {
    type: String,
    enum: ['given', 'received'],
    required: true,
    immutable: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
advanceSchema.index({ counterpartyId: 1 });
advanceSchema.index({ counterpartyType: 1 });
advanceSchema.index({ status: 1 });
advanceSchema.index({ givenDate: -1 });

const Advance = mongoose.model('Advance', advanceSchema);

module.exports = Advance; 