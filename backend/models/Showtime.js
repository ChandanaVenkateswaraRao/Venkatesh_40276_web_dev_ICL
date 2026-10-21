const mongoose = require('mongoose');

const ShowtimeSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true,
  },
  theaterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String, // e.g. "10:30 AM"
    required: true,
  },
  pricePremium: {
    type: Number,
    required: true,
    default: 350
  },
  priceExecutive: {
    type: Number,
    required: true,
    default: 250
  },
  format: {
    type: String,
    default: 'HDR BY BARCO'
  },
  screen: {
    type: String,
    default: 'Audi 1'
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'FAST_FILLING', 'ALMOST_FULL'],
    default: 'AVAILABLE'
  }
}, { timestamps: true });

module.exports = mongoose.model('Showtime', ShowtimeSchema);
