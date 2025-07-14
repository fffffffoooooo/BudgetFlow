const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  type: {
    type: String,
    enum: ['budget_limit', 'unusual_expense', 'monthly_report', 'weekly_report', 'subscription_created', 'subscription_updated', 'subscription_deleted', 'subscription_reminder', 'subscription_payment_failed', 'net_income_ceiling', 'insufficient_balance'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  resolved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Alert', AlertSchema);
