const express = require('express');
const router = express.Router();
const Theater = require('../models/Theater');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const Movie = require('../models/Movie');

// ==========================================
// THEATER PARTNER (OWNER) ROUTES
// ==========================================

// 1. Get theater info & analytics for logged-in theater partner
router.get('/partner/my-theater', auth, async (req, res) => {
  try {
    let theater = null;
    if (req.user.theaterId) {
      theater = await Theater.findById(req.user.theaterId);
    } else {
      theater = await Theater.findOne({ owner: req.user.id });
    }
    
    if (!theater) {
      theater = await Theater.findOne({});
    }

    const showtimesCount = await Showtime.countDocuments({ theaterId: theater._id });
    const showtimes = await Showtime.find({ theaterId: theater._id });
    const showtimeIds = showtimes.map(s => s._id);

    const bookings = await Booking.find({ showtime: { $in: showtimeIds } });
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    res.json({
      theater,
      stats: {
        totalShows: showtimesCount,
        totalBookings,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get all showtimes for partner's theater
router.get('/partner/showtimes', auth, async (req, res) => {
  try {
    let theaterId = req.user.theaterId;
    if (!theaterId) {
      const theater = await Theater.findOne({ owner: req.user.id }) || await Theater.findOne({});
      theaterId = theater._id;
    }

    const showtimes = await Showtime.find({ theaterId })
      .populate('movieId')
      .sort({ date: 1, time: 1 });

    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Add a new showtime
router.post('/partner/showtimes', auth, async (req, res) => {
  try {
    let theaterId = req.user.theaterId;
    if (!theaterId) {
      const theater = await Theater.findOne({ owner: req.user.id }) || await Theater.findOne({});
      theaterId = theater._id;
    }

    const { movieId, date, time, format, screen, pricePremium, priceExecutive } = req.body;

    const newShowtime = new Showtime({
      movieId,
      theaterId,
      date: new Date(date),
      time,
      format: format || 'HDR BY BARCO',
      screen: screen || 'Audi 1',
      pricePremium: Number(pricePremium) || 350,
      priceExecutive: Number(priceExecutive) || 200,
      status: 'AVAILABLE'
    });

    await newShowtime.save();
    const populated = await Showtime.findById(newShowtime._id).populate('movieId');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update showtime prices
router.put('/partner/showtimes/:id/price', auth, async (req, res) => {
  try {
    const { pricePremium, priceExecutive } = req.body;
    const showtime = await Showtime.findById(req.params.id);
    if (!showtime) return res.status(404).json({ msg: 'Showtime not found' });

    if (pricePremium !== undefined) showtime.pricePremium = Number(pricePremium);
    if (priceExecutive !== undefined) showtime.priceExecutive = Number(priceExecutive);

    await showtime.save();
    res.json(showtime);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Delete showtime
router.delete('/partner/showtimes/:id', auth, async (req, res) => {
  try {
    await Showtime.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Showtime removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Add a movie to catalog
router.post('/partner/add-movie', auth, async (req, res) => {
  try {
    const { title, image, genre, language, rating, trailerUrl } = req.body;
    
    let theater = null;
    if (req.user.theaterId) {
      theater = await Theater.findById(req.user.theaterId);
    }

    const movie = new Movie({
      title,
      image,
      genre,
      language,
      rating: Number(rating) || 8.5,
      trailerUrl: trailerUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      cities: theater ? [theater.city, 'Hyderabad', 'Mumbai', 'Bengaluru', 'Delhi-NCR'] : ['Hyderabad', 'Mumbai']
    });

    await movie.save();
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PUBLIC THEATER & SHOWTIME ROUTES
// ==========================================

// Get all theaters
router.get('/', async (req, res) => {
  try {
    const { city } = req.query;
    const query = city ? { city } : {};
    const theaters = await Theater.find(query);
    res.json(theaters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific showtime
router.get('/showtime/:id', async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id).populate('movieId').populate('theaterId');
    if (!showtime) return res.status(404).json({ msg: 'Showtime not found' });
    res.json(showtime);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get booked seats for a showtime
router.get('/showtime/:id/booked-seats', async (req, res) => {
  try {
    const bookings = await Booking.find({ showtime: req.params.id });
    let bookedSeats = [];
    bookings.forEach(b => {
      bookedSeats = [...bookedSeats, ...b.seats];
    });
    res.json(bookedSeats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get showtimes for a specific movie, grouped by theater (MUST BE LAST to avoid matching static paths)
router.get('/:movieId/showtimes', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { city, date } = req.query;
    
    // Find theaters in city if specified (case-insensitive regex)
    let theaterQuery = {};
    if (city) {
      theaterQuery.city = { $regex: new RegExp(`^${city}$`, 'i') };
    }
    let theaters = await Theater.find(theaterQuery);
    if (theaters.length === 0) {
      theaters = await Theater.find({});
    }
    const theaterIds = theaters.map(t => t._id);

    const showtimeQuery = { 
      movieId,
      theaterId: { $in: theaterIds }
    };

    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        const startOfDay = new Date(d);
        startOfDay.setHours(0, 0, 0, 0);
        const queryStart = new Date(startOfDay.getTime() - 12 * 60 * 60 * 1000);
        const queryEnd = new Date(startOfDay.getTime() + 36 * 60 * 60 * 1000);
        showtimeQuery.date = { $gte: queryStart, $lte: queryEnd };
      }
    }

    let showtimes = await Showtime.find(showtimeQuery).populate('theaterId');
    
    if (showtimes.length === 0) {
      showtimes = await Showtime.find({ movieId, theaterId: { $in: theaterIds } }).limit(25).populate('theaterId');
    }

    // Group showtimes by theater
    const grouped = showtimes.reduce((acc, showtime) => {
      if (!showtime.theaterId) return acc;
      const theaterIdStr = showtime.theaterId._id.toString();
      if (!acc[theaterIdStr]) {
        acc[theaterIdStr] = {
          theater: showtime.theaterId,
          showtimes: []
        };
      }
      acc[theaterIdStr].showtimes.push(showtime);
      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
