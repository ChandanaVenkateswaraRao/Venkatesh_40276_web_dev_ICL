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
      const parts = String(date).split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const startOfDay = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
        showtimeQuery.date = { $gte: startOfDay, $lte: endOfDay };
      } else {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
          const startOfDay = new Date(d);
          startOfDay.setUTCHours(0, 0, 0, 0);
          const endOfDay = new Date(d);
          endOfDay.setUTCHours(23, 59, 59, 999);
          showtimeQuery.date = { $gte: startOfDay, $lte: endOfDay };
        }
      }
    }

    let showtimes = await Showtime.find(showtimeQuery)
      .populate('theaterId')
      .sort({ date: 1, time: 1 });

    if (showtimes.length === 0 && !date) {
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

// 7. Theater Partner Portal: Add New Showtime (Supports Multi-Day & Multi-Time Scheduling with Conflict Validation)
const addPartnerShowtime = async (req, res, next) => {
  try {
    let theater = null;
    if (req.user.theaterId) {
      theater = await Theater.findById(req.user.theaterId);
    }
    if (!theater) {
      theater = (await Theater.findOne({ owner: req.user.id })) || (await Theater.findOne({}));
    }
    if (!theater) {
      return res.status(404).json({ success: false, msg: 'Theater profile not found' });
    }

    const theaterId = theater._id;
    const isSingleScreen = theater.theaterType === 'single_screen';

    const {
      movieId,
      date,
      time,
      startDate,
      days,
      times,
      format,
      screen,
      pricePremium,
      priceExecutive
    } = req.body;

    // 1. Determine Target Screen
    const targetScreen = isSingleScreen 
      ? (theater.screens?.[0]?.name || 'Main Screen')
      : (screen || theater.screens?.[0]?.name || 'Screen 1');

    // 2. Build Date Range
    const startBase = startDate || date || new Date().toISOString().split('T')[0];
    const numDays = Math.max(1, Math.min(30, Number(days) || 1));
    const dateList = [];

    for (let i = 0; i < numDays; i++) {
      const parts = startBase.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10) + i;
      const curDate = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
      dateList.push(curDate);
    }

    // 3. Build Times List
    let timeList = [];
    if (times && Array.isArray(times) && times.length > 0) {
      timeList = times.map(t => String(t).trim()).filter(Boolean);
    } else if (time && typeof time === 'string') {
      timeList = [time.trim()];
    } else {
      timeList = ['12:20 PM'];
    }

    if (timeList.length === 0) {
      return res.status(400).json({ success: false, msg: 'Please provide at least one showtime.' });
    }

    // 4. Validate Overlap / Conflict Across All Dates & Times
    for (const curDate of dateList) {
      const dayStart = new Date(curDate);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(curDate);
      dayEnd.setUTCHours(23, 59, 59, 999);

      for (const curTime of timeList) {
        const conflictQuery = {
          theaterId,
          date: { $gte: dayStart, $lte: dayEnd },
          time: { $regex: new RegExp(`^${curTime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        };

        // For multiplex, conflict applies specifically to this screen.
        // For single-screen, any show on this date/time in the theater is a conflict.
        if (!isSingleScreen) {
          conflictQuery.screen = targetScreen;
        }

        const existingShow = await Showtime.findOne(conflictQuery).populate('movieId');
        if (existingShow) {
          const dateStr = curDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const existingMovieTitle = existingShow.movieId?.title || 'Another movie';

          if (isSingleScreen) {
            return res.status(409).json({
              success: false,
              msg: `Schedule Conflict: In a single-screen cinema, only one movie can be played at a time. "${existingMovieTitle}" is already scheduled at ${curTime} on ${dateStr}.`
            });
          } else {
            return res.status(409).json({
              success: false,
              msg: `Schedule Conflict: Screen "${targetScreen}" already has "${existingMovieTitle}" scheduled at ${curTime} on ${dateStr}. In a multiplex, each screen can only play one movie at a time.`
            });
          }
        }
      }
    }

    // 5. Batch Create All Showtimes
    const showtimesToCreate = [];
    const chosenFormat = format || (theater.screens?.find(s => s.name === targetScreen)?.screenType || 'Dolby Atmos');

    for (const curDate of dateList) {
      for (const curTime of timeList) {
        showtimesToCreate.push({
          movieId,
          theaterId,
          date: curDate,
          time: curTime,
          format: chosenFormat,
          screen: targetScreen,
          pricePremium: Number(pricePremium) || 350,
          priceExecutive: Number(priceExecutive) || 200,
          status: 'AVAILABLE'
        });
      }
    }

    const createdDocs = await Showtime.insertMany(showtimesToCreate);
    const populated = await Showtime.find({ _id: { $in: createdDocs.map(s => s._id) } })
      .populate('movieId')
      .sort({ date: 1, time: 1 });

    res.status(201).json({
      success: true,
      count: populated.length,
      showtimes: populated
    });
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
