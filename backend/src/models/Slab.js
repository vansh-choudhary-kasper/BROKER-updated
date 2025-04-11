const mongoose = require('mongoose');

const slabSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  minAmount: {
    type: Number,
    required: true
  },
  maxAmount: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure slabs don't overlap for a company
slabSchema.pre('save', async function(next) {
  const Slab = this.constructor;
  const overlappingSlab = await Slab.findOne({
    company: this.company,
    _id: { $ne: this._id },
    $or: [
      {
        minAmount: { $lte: this.maxAmount },
        maxAmount: { $gte: this.minAmount }
      }
    ]
  });

  if (overlappingSlab) {
    throw new Error('Slab ranges cannot overlap');
  }
  next();
});

const Slab = mongoose.model('Slab', slabSchema);

module.exports = Slab; 