const Theater = require('../models/Theater');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');

// 1. Get all theaters, optionally filtered by city
const getAllTheaters = async (req, res, next) => {
  try {
    const { city } = req.query;
    const query = city ? { city: { $regex: new RegExp(`^${city}$`, 'i') } } : {};
    const theaters = await Theater.find(query);
    res.json(theaters);
  } catch (err) {
    next(err);
  }
};

// 2. Get specific showtime by ID
const getShowtimeById = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('movieId')
      .populate('theaterId');
    if (!showtime) {
      return res.status(404).json({ success: false, msg: 'Showtime not found' });
    }
    res.json(showtime);
  } catch (err) {
    next(err);
  }
};

// 3. Get booked seats for a specific showtime
const getBookedSeatsForShowtime = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ showtime: req.params.id });
    let bookedSeats = [];
    bookings.forEach((b) => {
      bookedSeats = [...bookedSeats, ...b.seats];
    });
    res.json(bookedSeats);
  } catch (err) {
    next(err);
  }
};

// 4. Get showtimes for a specific movie grouped by theater
const getMovieShowtimes = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { city, date } = req.query;

    let theaterQuery = {};
    if (city) {
      theaterQuery.city = { $regex: new RegExp(`^${city}$`, 'i') };
    }
    let theaters = await Theater.find(theaterQuery);
    if (theaters.length === 0) {
      theaters = await Theater.find({});
    }
    const theaterIds = theaters.map((t) => t._id);

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
      showtimes = await Showtime.find({ movieId, theaterId: { $in: theaterIds } })
        .limit(25)
        .populate('theaterId');
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
  } catch (err) {
    next(err);
  }
};

// 5. Theater Partner Portal: Get My Theater & Operational Stats
const getMyTheater = async (req, res, next) => {
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
    const showtimeIds = showtimes.map((s) => s._id);

    const bookings = await Booking.find({ showtime: { $in: showtimeIds } });
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Ensure screens and theaterType are populated
    let screens = theater.screens || [];
    if (screens.length === 0) {
      if (theater.theaterType === 'single_screen') {
        screens = [{ screenNumber: 1, name: 'Main Screen', screenType: 'Dolby Atmos', capacity: 250 }];
      } else {
        screens = [
          { screenNumber: 1, name: 'Audi 1', screenType: 'IMAX 4K Laser', capacity: 280 },
          { screenNumber: 2, name: 'Audi 2', screenType: 'Dolby Atmos', capacity: 200 },
          { screenNumber: 3, name: 'Audi 3', screenType: 'Standard 2D', capacity: 150 }
        ];
      }
    }

    res.json({
      theater: {
        ...theater.toObject(),
        theaterType: theater.theaterType || 'multiplex',
        screens
      },
      stats: {
        totalShows: showtimesCount,
        totalBookings,
        totalRevenue
      }
    });
  } catch (err) {
    next(err);
  }
};

// 6. Theater Partner Portal: Get All Showtimes
const getPartnerShowtimes = async (req, res, next) => {
  try {
    let theaterId = req.user.theaterId;
    if (!theaterId) {
      const theater = (await Theater.findOne({ owner: req.user.id })) || (await Theater.findOne({}));
      theaterId = theater._id;
    }

    const showtimes = await Showtime.find({ theaterId })
      .populate('movieId')
      .sort({ date: 1, time: 1 });

    res.json(showtimes);
  } catch (err) {
    next(err);
  }
};

// 7. Theater Partner Portal: Add New Showtime
const addPartnerShowtime = async (req, res, next) => {
  try {
    let theaterId = req.user.theaterId;
    if (!theaterId) {
      const theater = (await Theater.findOne({ owner: req.user.id })) || (await Theater.findOne({}));
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
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// 8. Theater Partner Portal: Update Showtime Price
const updateShowtimePrice = async (req, res, next) => {
  try {
    const { pricePremium, priceExecutive } = req.body;
    const showtime = await Showtime.findById(req.params.id);
    if (!showtime) {
      return res.status(404).json({ success: false, msg: 'Showtime not found' });
    }

    if (pricePremium !== undefined) showtime.pricePremium = Number(pricePremium);
    if (priceExecutive !== undefined) showtime.priceExecutive = Number(priceExecutive);

    await showtime.save();
    res.json(showtime);
  } catch (err) {
    next(err);
  }
};

// 9. Theater Partner Portal: Delete Showtime
const deleteShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(req.params.id);
    if (!showtime) {
      return res.status(404).json({ success: false, msg: 'Showtime not found' });
    }
    res.json({ success: true, msg: 'Showtime removed successfully' });
  } catch (err) {
    next(err);
  }
};

// 10. Theater Partner Portal: Add Movie To Catalog
const partnerAddMovie = async (req, res, next) => {
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
    res.status(201).json(movie);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllTheaters,
  getShowtimeById,
  getBookedSeatsForShowtime,
  getMovieShowtimes,
  getMyTheater,
  getPartnerShowtimes,
  addPartnerShowtime,
  updateShowtimePrice,
  deleteShowtime,
  partnerAddMovie
};
