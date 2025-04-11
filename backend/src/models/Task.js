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
    required: true
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
      ref: 'Broker'
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

  // Task status tracking
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
    // Current state of the task
  },

  // Financial tracking
  financialDetails: {
    clientAmount: {
      amount: { type: Number, required: true }, // Base amount
      gst: { type: Number, required: true }, // GST amount
      tds: { type: Number }, // TDS amount if applicable
      totalAmount: { type: Number, required: true }, // Total amount including taxes
      currency: { type: String, default: 'INR' }, // Currency of transaction
      paymentTerms: String, // Payment terms and conditions
      paymentSchedule: [{ // Payment installment details
        dueDate: Date, // When payment is due
        amount: Number, // Amount for this installment
        status: { type: String, enum: ['pending', 'paid', 'overdue'] } // Payment status
      }]
    },
    providerAmount: {
      amount: { type: Number, required: true }, // Base amount to provider
      gst: { type: Number, required: true }, // GST amount
      tds: { type: Number }, // TDS amount if applicable
      totalAmount: { type: Number, required: true }, // Total amount including taxes
      currency: { type: String, default: 'INR' }, // Currency of transaction
      paymentTerms: String, // Payment terms and conditions
      paymentSchedule: [{ // Payment installment details
        dueDate: Date, // When payment is due
        amount: Number, // Amount for this installment
        status: { type: String, enum: ['pending', 'paid', 'overdue'] } // Payment status
      }]
    },
    adminCommission: {
      amount: { type: Number, required: true }, // Base commission amount
      gst: { type: Number, required: true }, // GST on commission
      totalAmount: { type: Number, required: true }, // Total commission including GST
      currency: { type: String, default: 'INR' }, // Currency of transaction
      status: { type: String, enum: ['pending', 'paid'], default: 'pending' } // Payment status
    }
  },

  // Timeline tracking
  timeline: {
    startDate: { type: Date, required: true }, // When task should start
    endDate: { type: Date, required: true }, // When task should end
    actualStartDate: Date, // When task actually started
    actualEndDate: Date, // When task actually ended
  },

  // Document management
  documents: [{
    name: String, // Document name
    type: String, // Type of document
    url: String, // Where document is stored
    uploadDate: Date, // When document was uploaded
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who uploaded it
  }],

  // Legal agreements
  agreements: [{
    type: { type: String, enum: ['client', 'provider', 'broker'] }, // Type of agreement
    document: { type: String, url: String }, // Agreement document
    signedBy: {
      name: String, // Who signed
      designation: String, // Their role
      signature: { type: String, url: String }, // Their signature
      date: Date // When they signed
    }
  }],

  // Payment tracking
  payments: [{
    type: {
      type: String,
      enum: ['client', 'provider', 'helper_broker'],
      required: true
      // Who made the payment
    },
    amount: { type: Number, required: true }, // Payment amount
    date: { type: Date, required: true }, // When payment was made
    mode: { type: String, required: true }, // How payment was made
    reference: String, // Payment reference number
    bankDetails: { // Bank account details
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'disputed'],
      default: 'pending'
      // Payment status
    },
    documents: [{ type: String, url: String }], // Payment proof documents
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who verified the payment
    verificationDate: Date // When payment was verified
  }],

  // Communication and notes
  notes: [{
    content: String, // Note content
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
      // Who created the note
    },
    createdAt: {
      type: Date,
      default: Date.now
      // When note was created
    }
  }],

  // Dispute management
  disputes: [{
    date: Date, // When dispute arose
    type: String, // Type of dispute
    description: String, // What the dispute is about
    status: { type: String, enum: ['open', 'resolved', 'closed'] }, // Current status
    resolution: String, // How it was resolved
    documents: [{ type: String, url: String }], // Supporting documents
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who reported the dispute
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who resolved it
    resolutionDate: Date // When it was resolved
  }],

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
taskSchema.index({ taskNumber: 1 });
taskSchema.index({ clientCompany: 1 });
taskSchema.index({ providerCompany: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ 'timeline.startDate': 1, 'timeline.endDate': 1 });
taskSchema.index({ 'financialDetails.clientAmount.totalAmount': 1 });
taskSchema.index({ 'financialDetails.providerAmount.totalAmount': 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 