const express = require('express');
const router = express.Router();
const theaterController = require('../controllers/theaterController');
const adminController = require('../controllers/adminController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const {
  createShowtimeSchema,
  updatePriceSchema,
  partnerAddMovieSchema
} = require('../validators/theaterValidator');

// ==========================================
// THEATER PARTNER (OWNER) ROUTES
// ==========================================
router.get('/partner/my-theater', auth, theaterController.getMyTheater);
router.get('/partner/showtimes', auth, theaterController.getPartnerShowtimes);
router.post('/partner/showtimes', auth, validate(createShowtimeSchema), theaterController.addPartnerShowtime);
router.put('/partner/showtimes/:id/price', auth, validate(updatePriceSchema), theaterController.updateShowtimePrice);
router.delete('/partner/showtimes/:id', auth, theaterController.deleteShowtime);
router.post('/partner/add-movie', auth, validate(partnerAddMovieSchema), theaterController.partnerAddMovie);
router.post('/partner/validate-ticket', auth, adminController.validateTicket);

// ==========================================
// PUBLIC THEATER & SHOWTIME ROUTES
// ==========================================
router.get('/', theaterController.getAllTheaters);
router.get('/showtime/:id', theaterController.getShowtimeById);
router.get('/showtime/:id/booked-seats', theaterController.getBookedSeatsForShowtime);

// Grouped showtimes by theater (placed after static routes)
router.get('/:movieId/showtimes', theaterController.getMovieShowtimes);

module.exports = router;
