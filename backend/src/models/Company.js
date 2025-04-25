const mongoose = require('mongoose');
const slabSchema = require('./SlabSchema');

const documentSchema = new mongoose.Schema({
  fieldPath: String,
  url: String,
  publicId: String,
  originalName: String,
  mimetype: String,
  size: Number,
  uploadDate: { type: Date, default: Date.now },
});

const companySchema = new mongoose.Schema({
  // Basic company identification
  name: {
    type: String,
    required: true,
    trim: true
    // Required for legal identification and documentation
  },
  type: {
    type: String,
    enum: ['client', 'provider', 'both'],
    required: true
    // Determines the role of the company in transactions and affects business logic
  },
  
  // Primary contact information for day-to-day operations
  contactPerson: {
    name: { type: String, required: true }, // Primary point of contact for all communications
    email: { type: String, required: true }, // Official communication channel
    phone: { type: String, required: true }, // Primary contact number
    designation: String, // Role in the company for proper communication hierarchy
    alternatePhone: String, // Backup contact in case primary is unavailable
    idProof: {
      type: { type: String, enum: ['aadhar', 'pan', 'passport', 'driving_license', 'voter_id'] }, // Government-issued ID for verification
      number: String, // Unique identification number
      document: { type: String, url: String } // Scanned copy for verification
    }
  },

  // Legal and regulatory compliance information
  businessDetails: {
    gstNumber: { type: String, required: true, unique: true }, // Required for tax compliance and invoicing
    panNumber: { type: String, required: true, unique: true }, // Required for financial transactions and tax filing
    cinNumber: { type: String, unique: true }, // Company registration number for legal verification
    tdsNumber: { type: String, unique: true }, // Tax Deduction and Collection Account Number
    registrationDate: Date, // When the company was registered
    // businessType: String, // Nature of business operations
    // industry: String, // Sector classification
    registrationAuthority: String, // Government body that registered the company
    registrationCertificate: { type: String, url: String }, // Proof of legal registration
    // businessCategory: String, // Classification for business rules
    // annualTurnover: Number, // Financial capacity indicator
    // employeeCount: Number // Company size indicator
  },

  // Legal entity information
  legalDetails: {
    registeredName: String, // Official registered name
    // tradeName: String, // Name used for trading
    // incorporationDate: Date, // When the company was incorporated
    // incorporationNumber: String, // Unique incorporation identifier
    registeredOffice: {
      address: String, // Legal address for official communications
      city: String,
      state: String,
      country: String,
      pincode: String
    },
    // authorizedSignatories: [{ // People authorized to sign documents
    //   name: String,
    //   designation: String,
    //   idProof: {
    //     type: { type: String },
    //     number: String,
    //     document: { type: String, url: String }
    //   },
    //   signature: { type: String, url: String } // Digital signature for documents
    // }],
    // boardOfDirectors: [{ // Company leadership
    //   name: String,
    //   designation: String,
    //   dinNumber: String, // Director Identification Number
    //   idProof: {
    //     type: { type: String },
    //     number: String,
    //     document: { type: String, url: String }
    //   }
    // }]
  },

  // Physical location details
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    landmark: String // For easy location identification
  },

  // Financial account information
  bankDetails: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bank',
    _id: false
  }],

  documents: {
    incorporationCertificate: documentSchema,
    memorandumOfAssociation: documentSchema,
    articlesOfAssociation: documentSchema,
    boardResolution: documentSchema,
    taxRegistration: documentSchema,
    otherDocuments: [documentSchema]
  },

  // Verification tracking
//   verificationStatus: {
//     gstVerified: { type: Boolean, default: false }, // GST number verification
//     panVerified: { type: Boolean, default: false }, // PAN verification
//     cinVerified: { type: Boolean, default: false }, // CIN verification
//     bankVerified: { type: Boolean, default: false }, // Bank account verification
//     documentsVerified: { type: Boolean, default: false }, // Overall document verification
//     lastVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who performed last verification
//     lastVerifiedDate: Date // When last verification was done
//   },

  // Company status
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted', 'pending_verification'],
    default: 'pending_verification'
    // Current operational status of the company
  },

  // Slabs
  slabs: [slabSchema],

  // Risk management
  riskAssessment: {
    score: { type: Number, default: 0 }, // Numerical risk score
    factors: [String], // List of risk factors
    lastAssessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who assessed the risk
    lastAssessedDate: Date // When risk was last assessed
  },

//   // Compliance tracking
//   complianceHistory: [{
//     date: Date,
//     type: String,
//     description: String,
//     status: String,
//     documents: [{ type: String, url: String }] // Supporting documents
//   }],

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
companySchema.index({ 'businessDetails.gstNumber': 1 }, { unique: true , sparse: true});
companySchema.index({ 'businessDetails.panNumber': 1 }, { unique: true , sparse: true});
companySchema.index({ 'businessDetails.cinNumber': 1 }, { unique: true , sparse: true});
companySchema.index({ 'businessDetails.tdsNumber': 1 }, { unique: true , sparse: true});
companySchema.index({ name: 1 }, { unique: true, sparse: true });
companySchema.index({ 'verificationStatus.gstVerified': 1 });
companySchema.index({ 'verificationStatus.panVerified': 1 });
companySchema.index({ status: 1 });

const Company = mongoose.model('Company', companySchema);

module.exports = Company; 