const express = require('express');
const Movie = require('../models/Movie');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, city } = req.query;
    let query = {};
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    if (city) {
      query.cities = city; // matches if the array contains the city
    }

    const movies = await Movie.find(query);
    res.json(movies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', async (req, res) => {
  try {
    const newMovie = new Movie(req.body);
    const movie = await newMovie.save();
    res.json(movie);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ msg: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

const Booking = require('../models/Booking');

router.get('/:id/booked-seats', async (req, res) => {
  try {
    const bookings = await Booking.find({ movie: req.params.id });
    let bookedSeats = [];
    bookings.forEach(b => {
      bookedSeats = [...bookedSeats, ...b.seats];
    });
    res.json(bookedSeats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



const Review = require('../models/Review');
const auth = require('../middleware/auth');

router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ movieId: req.params.id }).populate('userId', 'name').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, text } = req.body;
    
    // Check if user actually booked this movie
    const hasBooked = await Booking.findOne({ user: req.user.id, movie: req.params.id });
    if (!hasBooked) {
      return res.status(403).json({ msg: 'You must book a ticket for this movie before reviewing it.' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ userId: req.user.id, movieId: req.params.id });
    if (existingReview) {
      return res.status(400).json({ msg: 'You have already reviewed this movie.' });
    }

    const newReview = new Review({
      movieId: req.params.id,
      userId: req.user.id,
      rating,
      text
    });
    
    const review = await newReview.save();

    // Update movie aggregate rating
    const reviews = await Review.find({ movieId: req.params.id });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await Movie.findByIdAndUpdate(req.params.id, { rating: avgRating.toFixed(1) });

    res.json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
module.exports = router;
