const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { createMovieSchema, createReviewSchema } = require('../validators/movieValidator');

// Public Movies Catalog & Search
router.get('/', movieController.getMovies);
router.post('/', validate(createMovieSchema), movieController.createMovie);
router.get('/:id', movieController.getMovieById);
router.get('/:id/booked-seats', movieController.getBookedSeats);

// Movie Reviews
router.get('/:id/reviews', movieController.getReviews);
router.post('/:id/reviews', auth, validate(createReviewSchema), movieController.addReview);

module.exports = router;
