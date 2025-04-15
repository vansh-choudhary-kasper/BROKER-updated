const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const slabSchema = new mongoose.Schema({
  minAmount: {
    type: Number,
    required: true,
    min: 0
  },
  maxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commission: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
});

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  dueDate: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  tags: [String],
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

const userSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['admin', 'broker', 'accountant', 'viewer'],
    default: 'viewer'
  },
  phone: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  clientSlabs: [slabSchema],
  providerSlabs: [slabSchema],
  lastLogin: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  todos: [todoSchema]
}, {
  timestamps: true
});

// Validate slabs before saving
userSchema.pre('save', async function(next) {
  // Skip validation if slabs are not modified
  if (!this.isModified('clientSlabs') && !this.isModified('providerSlabs')) {
    return next();
  }

  try {
    // Validate client slabs
    if (this.clientSlabs.length > 0) {
      // Sort slabs by minAmount
      this.clientSlabs.sort((a, b) => a.minAmount - b.minAmount);
      
      // Check for gaps and overlaps
      for (let i = 0; i < this.clientSlabs.length - 1; i++) {
        if (this.clientSlabs[i].maxAmount + 1 !== this.clientSlabs[i + 1].minAmount) {
          throw new Error('Client slabs must be continuous without gaps or overlaps');
        }
      }
    }

    // Validate provider slabs
    if (this.providerSlabs.length > 0) {
      // Sort slabs by minAmount
      this.providerSlabs.sort((a, b) => a.minAmount - b.minAmount);
      
      // Check for gaps and overlaps
      for (let i = 0; i < this.providerSlabs.length - 1; i++) {
        if (this.providerSlabs[i].maxAmount + 1 !== this.providerSlabs[i + 1].minAmount) {
          throw new Error('Provider slabs must be continuous without gaps or overlaps');
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 