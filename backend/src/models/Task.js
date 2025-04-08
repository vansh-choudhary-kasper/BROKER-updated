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
    brokerCommission: {
      amount: { type: Number, required: true }, // Base commission amount
      gst: { type: Number, required: true }, // GST on commission
      totalAmount: { type: Number, required: true }, // Total commission including GST
      currency: { type: String, default: 'INR' } // Currency of transaction
    }
  },

  // Timeline tracking
  timeline: {
    startDate: { type: Date, required: true }, // When task should start
    endDate: { type: Date, required: true }, // When task should end
    actualStartDate: Date, // When task actually started
    actualEndDate: Date, // When task actually ended
    milestones: [{ // Task progress tracking
      title: String, // Milestone name
      description: String, // What needs to be done
      dueDate: Date, // When it should be completed
      completedDate: Date, // When it was completed
      status: { type: String, enum: ['pending', 'completed', 'delayed'] } // Current status
    }]
  },

  // Document management
  documents: [{
    name: String, // Document name
    type: String, // Type of document
    url: String, // Where document is stored
    uploadDate: Date, // When document was uploaded
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who uploaded it
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'] }, // Document verification status
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who verified it
    verificationDate: Date // When it was verified
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
    },
    witnesses: [{ // Legal witnesses
      name: String,
      idProof: {
        type: { type: String },
        number: String,
        document: { type: String, url: String }
      },
      signature: { type: String, url: String },
      date: Date
    }],
    notary: { // Notary details
      name: String,
      registrationNumber: String,
      date: Date,
      document: { type: String, url: String }
    }
  }],

  // Payment tracking
  payments: [{
    type: {
      type: String,
      enum: ['client', 'provider'],
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
    },
    attachments: [{ type: String, url: String }] // Supporting documents
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

  // Audit trail
  auditTrail: [{
    action: String, // What was done
    description: String, // Details of the action
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who did it
    timestamp: { type: Date, default: Date.now }, // When it was done
    ipAddress: String, // From where it was done
    userAgent: String // What was used to do it
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