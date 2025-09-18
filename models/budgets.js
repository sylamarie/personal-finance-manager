const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  budgetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

budgetSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.budgetAmount - this.spentAmount);
});

budgetSchema.virtual('percentageUsed').get(function() {
  return this.budgetAmount > 0 ? (this.spentAmount / this.budgetAmount) * 100 : 0;
});

module.exports = mongoose.model('Budget', budgetSchema);