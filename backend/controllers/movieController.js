const Movie = require('../models/Movie');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Showtime = require('../models/Showtime');
const Theater = require('../models/Theater');

// 1. Get all movies with optional search, city, and showtime availability filters
const getMovies = async (req, res, next) => {
  try {
    const { search, city, all } = req.query;
    let query = {};

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    // When all=true (e.g. Partner Portal or Admin Portal selecting movies from catalog),
    // return all movies without filtering by showtimes.
    if (all === 'true') {
      const movies = await Movie.find(query);
      return res.json(movies);
    }

    // For User Portal (Home, Search, Recommendations):
    // Only return movies that currently have active / available showtimes!
    let showtimeFilter = {};

    if (city && city.trim() && city.toUpperCase() !== 'ALL') {
      const matchingTheaters = await Theater.find({
        city: { $regex: new RegExp(`^${city.trim()}$`, 'i') }
      }).select('_id');
      const theaterIds = matchingTheaters.map(t => t._id);
      showtimeFilter.theaterId = { $in: theaterIds };
    }

    // Find all distinct movie IDs that have scheduled showtimes
    const activeMovieIds = await Showtime.distinct('movieId', showtimeFilter);
    query._id = { $in: activeMovieIds };

    const movies = await Movie.find(query);
    res.json(movies);
  } catch (err) {
    next(err);
  }
};

// 2. Create a new movie (with optional immediate initial showtime)
const createMovie = async (req, res, next) => {
  try {
    const { title, image, genre, language, rating, trailerUrl, cities, initialShowtime } = req.body;
    const newMovie = new Movie({
      title,
      image,
      genre,
      language,
      rating,
      trailerUrl: trailerUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      cities: cities || ['Hyderabad', 'Mumbai', 'Bengaluru']
    });
    const movie = await newMovie.save();

    // If initial showtime was provided, schedule it immediately
    let createdShowtime = null;
    if (initialShowtime && initialShowtime.theaterId && initialShowtime.date && initialShowtime.time) {
      createdShowtime = new Showtime({
        movieId: movie._id,
        theaterId: initialShowtime.theaterId,
        date: new Date(initialShowtime.date),
        time: initialShowtime.time,
        format: initialShowtime.format || 'HDR BY BARCO',
        screen: initialShowtime.screen || 'Audi 1',
        pricePremium: Number(initialShowtime.pricePremium) || 350,
        priceExecutive: Number(initialShowtime.priceExecutive) || 200,
        status: 'AVAILABLE'
      });
      await createdShowtime.save();
    }

    res.status(201).json({ movie, showtime: createdShowtime });
  } catch (err) {
    next(err);
  }
};

// 3. Get single movie by ID with showtime availability metadata
const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, msg: 'Movie not found' });
    }
    const showtimesCount = await Showtime.countDocuments({ movieId: movie._id });
    const movieObj = movie.toObject();
    movieObj.hasShows = showtimesCount > 0;
    movieObj.showtimesCount = showtimesCount;
    res.json(movieObj);
  } catch (err) {
    next(err);
  }
};

// 4. Get booked seats for a movie across all shows
const getBookedSeats = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ movie: req.params.id });
    let bookedSeats = [];
    bookings.forEach((b) => {
      bookedSeats = [...bookedSeats, ...b.seats];
    });
    res.json(bookedSeats);
  } catch (err) {
    next(err);
  }
};

// 5. Get reviews for a movie
const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ movieId: req.params.id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

// 6. Post a review for a movie (verified booking required)
const addReview = async (req, res, next) => {
  try {
    const { rating, text } = req.body;

    // Check if user actually booked this movie
    const hasBooked = await Booking.findOne({ user: req.user.id, movie: req.params.id });
    if (!hasBooked) {
      return res.status(403).json({
        success: false,
        msg: 'You must book a ticket for this movie before reviewing it.'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ userId: req.user.id, movieId: req.params.id });
    if (existingReview) {
      return res.status(400).json({ success: false, msg: 'You have already reviewed this movie.' });
    }

    const newReview = new Review({
      movieId: req.params.id,
      userId: req.user.id,
      rating,
      text
    });

    const review = await newReview.save();

    // Update aggregate movie rating
    const reviews = await Review.find({ movieId: req.params.id });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await Movie.findByIdAndUpdate(req.params.id, { rating: Number(avgRating.toFixed(1)) });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMovies,
  createMovie,
  getMovieById,
  getBookedSeats,
  getReviews,
  addReview
};
