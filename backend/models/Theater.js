const mongoose = require('mongoose');

const ScreenSchema = new mongoose.Schema({
  screenNumber: {
    type: Number,
    required: true,
    default: 1
  },
  name: {
    type: String,
    required: true,
    default: 'Audi 1'
  },
  screenType: {
    type: String,
    default: 'Standard 2D'
  },
  capacity: {
    type: Number,
    default: 150
  }
}, { _id: false });

const TheaterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  theaterType: {
    type: String,
    enum: ['single_screen', 'multiplex'],
    default: 'multiplex',
  },
  screens: [ScreenSchema],
  cancellable: {
    type: Boolean,
    default: false,
  },
  amenities: [{
    type: String
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

module.exports = mongoose.model('Theater', TheaterSchema);
