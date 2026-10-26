const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['user', 'theater_owner', 'admin'],
    default: 'user',
  },
  theaterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater',
  },
  otp: String,
  otpExpires: Date,
  walletBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
});

module.exports = mongoose.model('User', UserSchema);
