const mongoose = require('mongoose');

const WalletTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['CREDIT', 'DEBIT'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  source: {
    type: String,
    enum: ['GIFT_CARD_REDEEM', 'TICKET_BOOKING', 'REFUND'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  referenceId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
