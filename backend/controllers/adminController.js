const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const User = require('../models/User');
const Theater = require('../models/Theater');
const Showtime = require('../models/Showtime');

// 1. Get all bookings
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('movie')
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// 2. Get high-level dashboard metrics
const getDashboardStats = async (req, res, next) => {
  try {
    const totalMovies = await Movie.countDocuments();
    const totalBookings = await Booking.countDocuments();

    const revenueAggregation = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

    res.json({ totalMovies, totalBookings, totalRevenue });
  } catch (err) {
    next(err);
  }
};

// 3. Get 7-day revenue & ticket analytics
const getAnalytics = async (req, res, next) => {
  try {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const bookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          tickets: { $sum: { $size: '$seats' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const chartData = bookings.map((b) => ({
      name: b._id,
      revenue: b.revenue,
      tickets: b.tickets
    }));

    res.json(chartData);
  } catch (err) {
    next(err);
  }
};

// 4. Validate Ticket from QR Code scanner
const validateTicket = async (req, res, next) => {
  try {
    const { paymentId, ticketId } = req.body;
    const identifier = String(paymentId || ticketId || '').replace(/^TICKET:/i, '').trim();

    if (!identifier) {
      return res.status(400).json({ success: false, msg: 'Ticket QR code or reference is required' });
    }

    let booking = null;

    // Check if identifier is a MongoDB ObjectId (as encoded in customer QR codes: TICKET:<booking._id>)
    if (mongoose.Types.ObjectId.isValid(identifier) && identifier.length === 24) {
      booking = await Booking.findById(identifier)
        .populate('movie')
        .populate('user', 'email name phone')
        .populate({ path: 'showtime', populate: { path: 'theaterId' } });
    }

    // Fallback: Check if identifier is a paymentId (e.g. pay_xxx or WALLET_xxx)
    if (!booking) {
      booking = await Booking.findOne({ paymentId: identifier })
        .populate('movie')
        .populate('user', 'email name phone')
        .populate({ path: 'showtime', populate: { path: 'theaterId' } });
    }

    if (!booking) {
      return res.status(404).json({ success: false, msg: 'Ticket not found or invalid' });
    }

    res.json(booking);
  } catch (err) {
    next(err);
  }
};

// 5. Get all theaters with owner and show stats
const getAllTheaters = async (req, res, next) => {
  try {
    const theaters = await Theater.find().populate('owner', 'name email role');

    const enrichedTheaters = await Promise.all(
      theaters.map(async (th) => {
        const showtimesCount = await Showtime.countDocuments({ theaterId: th._id });
        const showtimes = await Showtime.find({ theaterId: th._id }, '_id');
        const showtimeIds = showtimes.map((s) => s._id);
        const bookingsCount = await Booking.countDocuments({ showtime: { $in: showtimeIds } });

        // Provide default screens if legacy theater had none
        let screens = th.screens || [];
        if (screens.length === 0) {
          if (th.theaterType === 'single_screen') {
            screens = [{ screenNumber: 1, name: 'Main Screen', screenType: 'Dolby Atmos', capacity: 250 }];
          } else {
            screens = [
              { screenNumber: 1, name: 'Audi 1', screenType: 'IMAX 4K Laser', capacity: 280 },
              { screenNumber: 2, name: 'Audi 2', screenType: 'Dolby Atmos', capacity: 200 },
              { screenNumber: 3, name: 'Audi 3', screenType: 'Standard 2D', capacity: 150 }
            ];
          }
        }

        return {
          ...th.toObject(),
          screens,
          stats: {
            showtimesCount,
            bookingsCount
          }
        };
      })
    );

    res.json(enrichedTheaters);
  } catch (err) {
    next(err);
  }
};

// 6. Register a new theater and assign owner
const createTheater = async (req, res, next) => {
  try {
    const {
      name,
      city,
      location,
      theaterType = 'multiplex',
      screens,
      cancellable = true,
      amenities = ['M-Ticket', 'Food & Beverage', 'Dolby Atmos'],
      ownerName,
      ownerEmail,
      ownerPassword
    } = req.body;

    let existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, msg: 'A user with this owner email already exists' });
    }

    // Prepare default screens based on theater type if not supplied
    let finalScreens = screens;
    if (!finalScreens || finalScreens.length === 0) {
      if (theaterType === 'single_screen') {
        finalScreens = [
          { screenNumber: 1, name: 'Main Screen', screenType: 'Dolby Atmos', capacity: 250 }
        ];
      } else {
        finalScreens = [
          { screenNumber: 1, name: 'Audi 1', screenType: 'IMAX 4K Laser', capacity: 280 },
          { screenNumber: 2, name: 'Audi 2', screenType: 'Dolby Atmos', capacity: 200 },
          { screenNumber: 3, name: 'Audi 3', screenType: 'Standard 2D', capacity: 150 }
        ];
      }
    }

    const theater = new Theater({
      name,
      city,
      location,
      theaterType,
      screens: finalScreens,
      cancellable,
      amenities
    });
    await theater.save();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ownerPassword, salt);

    const owner = new User({
      name: ownerName,
      email: ownerEmail,
      password: hashedPassword,
      role: 'theater_owner',
      theaterId: theater._id,
      isVerified: true
    });
    await owner.save();

    theater.owner = owner._id;
    await theater.save();

    const populatedTheater = await Theater.findById(theater._id).populate('owner', 'name email role');
    res.status(201).json({
      success: true,
      theater: populatedTheater
    });
  } catch (err) {
    next(err);
  }
};

// 6b. Update theater details
const updateTheater = async (req, res, next) => {
  try {
    const { name, city, location, cancellable, amenities, theaterType, screens, ownerName, ownerEmail } = req.body;
    const theater = await Theater.findById(req.params.id);
    if (!theater) {
      return res.status(404).json({ success: false, msg: 'Theater not found' });
    }

    if (name) theater.name = name;
    if (city) theater.city = city;
    if (location !== undefined) theater.location = location;
    if (cancellable !== undefined) theater.cancellable = cancellable;
    if (amenities) theater.amenities = amenities;
    if (theaterType) theater.theaterType = theaterType;
    if (screens && screens.length > 0) theater.screens = screens;

    await theater.save();

    if (theater.owner && (ownerName || ownerEmail)) {
      const owner = await User.findById(theater.owner);
      if (owner) {
        if (ownerName) owner.name = ownerName;
        if (ownerEmail) owner.email = ownerEmail;
        await owner.save();
      }
    }

    const updated = await Theater.findById(theater._id).populate('owner', 'name email role');
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// 6c. Reset partner password
const resetPartnerPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const theater = await Theater.findById(req.params.id);
    if (!theater || !theater.owner) {
      return res.status(404).json({ success: false, msg: 'Theater or partner owner not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(theater.owner, { password: hashedPassword });

    res.json({ success: true, msg: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// 7. Delete theater and associated showtimes
const deleteTheater = async (req, res, next) => {
  try {
    const theater = await Theater.findByIdAndDelete(req.params.id);
    if (!theater) {
      return res.status(404).json({ success: false, msg: 'Theater not found' });
    }

    await Showtime.deleteMany({ theaterId: req.params.id });
    if (theater.owner) {
      await User.findByIdAndDelete(theater.owner);
    }

    res.json({ success: true, msg: 'Theater and credentials removed successfully' });
  } catch (err) {
    next(err);
  }
};

// 8. Admin add show
const addShow = async (req, res, next) => {
  try {
    const { movieId, theaterId, date, time, format, screen, pricePremium, priceExecutive } = req.body;

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
    res.status(201).json(newShowtime);
  } catch (err) {
    next(err);
  }
};

// 9. Automated Traffic Simulation Engine
const simulateTraffic = async (req, res, next) => {
  try {
    const { mode = 'standard', count = 3 } = req.body;
    const io = req.app.get('io');
    const seatLocks = req.app.get('seatLocks');
    const broadcastAuditEvent = req.app.get('broadcastAuditEvent');

    const showtimes = await Showtime.find({}).populate('movieId').populate('theaterId').limit(10);
    if (showtimes.length === 0) {
      return res.status(400).json({ success: false, msg: 'No showtimes available to simulate' });
    }

    let demoUser = await User.findOne({ email: 'demobuyer@demo.com' });
    if (!demoUser) {
      demoUser = new User({
        name: 'Demo Concurrency User',
        email: 'demobuyer@demo.com',
        password: 'demopassword123',
        isVerified: true
      });
      await demoUser.save();
    }

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const generatedEvents = [];

    for (let i = 0; i < Math.min(count, 8); i++) {
      const targetShow = showtimes[Math.floor(Math.random() * showtimes.length)];
      const showtimeIdStr = targetShow._id.toString();
      const randomRow = rows[Math.floor(Math.random() * rows.length)];
      const randomCol = Math.floor(Math.random() * 12) + 1;
      const seatId = `${randomRow}${randomCol}`;
      const fakeSocketId = `sim_sock_${Math.random().toString(36).substring(2, 7)}`;
      const fakeBuyerName = `Buyer-${Math.floor(100 + Math.random() * 900)}`;

      if (mode === 'collision') {
        if (!seatLocks.has(showtimeIdStr)) {
          seatLocks.set(showtimeIdStr, new Map());
        }
        seatLocks.get(showtimeIdStr).set(seatId, {
          socketId: fakeSocketId,
          userId: demoUser._id,
          userLabel: fakeBuyerName,
          lockedAt: Date.now()
        });

        if (io) {
          io.to(`showtime_${showtimeIdStr}`).emit('seat_locked_by_other', {
            seatId,
            socketId: fakeSocketId,
            userId: demoUser._id,
            userLabel: fakeBuyerName
          });
        }

        if (broadcastAuditEvent) {
          broadcastAuditEvent('LOCK', `[SIMULATED CONCURRENCY] ${fakeBuyerName} held seat ${seatId} in ${targetShow.theaterId?.name}`, { showtimeId: showtimeIdStr, seatId });
        }

        generatedEvents.push({ type: 'LOCK', seatId, showtime: targetShow._id });
      } else {
        const simulatedBooking = new Booking({
          user: demoUser._id,
          movie: targetShow.movieId?._id,
          showtime: targetShow._id,
          seats: [seatId],
          totalAmount: targetShow.priceExecutive || 250,
          paymentId: `sim_pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        });
        await simulatedBooking.save();

        if (io) {
          io.to(`showtime_${showtimeIdStr}`).emit('seats_permanently_booked', {
            showtimeId: showtimeIdStr,
            seats: [seatId]
          });

          const bookingAlert = {
            bookingId: simulatedBooking._id,
            movieTitle: targetShow.movieId?.title || 'Simulated Movie',
            theaterName: targetShow.theaterId?.name || 'Multiplex',
            seats: [seatId],
            amount: simulatedBooking.totalAmount,
            userEmail: demoUser.email,
            createdAt: new Date().toISOString()
          };

          io.to('admin_feed').emit('new_live_booking', bookingAlert);
          io.emit('new_live_booking', bookingAlert);
        }

        if (broadcastAuditEvent) {
          broadcastAuditEvent('BOOK', `[SIMULATED BOOKING] Confirmed seat ${seatId} for ${targetShow.movieId?.title} (₹${simulatedBooking.totalAmount})`, { bookingId: simulatedBooking._id });
        }

        generatedEvents.push({ type: 'BOOK', seatId, bookingId: simulatedBooking._id });
      }
    }

    res.json({
      success: true,
      mode,
      eventsGenerated: generatedEvents.length,
      details: generatedEvents
    });
  } catch (err) {
    next(err);
  }
};

// 10. Clear demo bookings and reset seat locks
const clearDemoBookings = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const seatLocks = req.app.get('seatLocks');
    const broadcastAuditEvent = req.app.get('broadcastAuditEvent');

    const demoUsers = await User.find({ email: /@demo\.com$/ }).distinct('_id');
    const deleteQuery = {
      $or: [
        { paymentId: { $regex: /^sim_/ } },
        { user: { $in: demoUsers } }
      ]
    };

    const result = await Booking.deleteMany(deleteQuery);

    if (seatLocks) {
      seatLocks.clear();
    }

    if (io) {
      io.emit('demo_state_reset');
      if (broadcastAuditEvent) {
        broadcastAuditEvent('SIMULATE', `Demo state reset: Purged ${result.deletedCount} simulated bookings and cleared active in-memory seat locks.`, { deletedCount: result.deletedCount });
      }
    }

    res.json({
      success: true,
      msg: `Purged ${result.deletedCount} demo bookings and reset seat inventory!`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    next(err);
  }
};

// 11. Real-time Telemetry Stats for HUD
const getTelemetryStats = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const getTotalActiveLocksCount = req.app.get('getTotalActiveLocksCount');

    const activeSockets = io ? io.sockets.sockets.size : 0;
    const activeRooms = io ? io.sockets.adapter.rooms.size : 0;
    const activeLocks = getTotalActiveLocksCount ? getTotalActiveLocksCount() : 0;

    res.json({
      socketStatus: 'CONNECTED',
      port: process.env.PORT || 5000,
      activeSockets,
      activeRooms,
      activeLocks,
      uptime: Math.round(process.uptime())
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllBookings,
  getDashboardStats,
  getAnalytics,
  validateTicket,
  getAllTheaters,
  createTheater,
  updateTheater,
  resetPartnerPassword,
  deleteTheater,
  addShow,
  simulateTraffic,
  clearDemoBookings,
  getTelemetryStats
};
