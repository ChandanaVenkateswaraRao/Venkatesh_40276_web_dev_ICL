const mongoose = require('mongoose');

const GiftCardSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  pin: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  theme: {
    id: String,
    name: String,
    bgClass: String,
    textColor: String,
    badge: String,
  },
  recipientName: {
    type: String,
    default: 'Valued Customer',
  },
  recipientEmail: {
    type: String,
    default: '',
  },
  senderName: {
    type: String,
    default: 'A Well-Wisher',
  },
  message: {
    type: String,
    default: 'Enjoy the movies and entertainment on me.',
  },
  quantity: {
    type: Number,
    default: 1,
  },
  purchasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  isRedeemed: {
    type: Boolean,
    default: false,
  },
  redeemedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  redeemedAt: Date,
  expiryDate: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Year validity
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('GiftCard', GiftCardSchema);
