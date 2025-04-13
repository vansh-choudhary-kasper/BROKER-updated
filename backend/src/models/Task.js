const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // Basic task information
  title: {
    type: String,
    required: true,
    trim: true
    // Brief description of the task for quick identification
  },
  description: {
    type: String,
    // Detailed explanation of the task requirements and scope
  },
  taskNumber: {
    type: String,
    required: true,
    unique: true
    // Unique identifier for tracking and referencing tasks
  },

  // Company relationships
  clientCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
    // Company that requested the task
  },
  providerCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
    // Company that will execute the task
  },
  
  // Broker relationships
  // Admin broker is directly from User model, no need for reference
  // Helper broker is optional and there's at most one per task
  helperBroker: {
    broker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Broker',
      default: null
      // Optional helper broker
    },
    commission: {
      type: Number,
      min: 0,
      max: 100
      // Commission percentage for the helper broker
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
      // Payment status for the helper broker
    },
    paymentDate: Date
    // When the helper broker was paid
  },

  payment: {
    amount: { 
      type: Number,
      default: 0,
      min: 0
      // Total payment amount for the task
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
      // Currency of the payment
    },
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ taskNumber: 1 });
taskSchema.index({ clientCompany: 1 });
taskSchema.index({ providerCompany: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ 'timeline.startDate': 1, 'timeline.endDate': 1 });
taskSchema.index({ 'financialDetails.clientAmount.totalAmount': 1 });
taskSchema.index({ 'financialDetails.providerAmount.totalAmount': 1 });
taskSchema.index({ createdAt: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 