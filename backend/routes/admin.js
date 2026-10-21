const express = require('express');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const User = require('../models/User');
const Theater = require('../models/Theater');
const Showtime = require('../models/Showtime');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Get all bookings for admin
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('movie')
      .populate('user', 'email')
      .sort({ createdAt: -1 });
      
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalMovies = await Movie.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    const revenueAggregation = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;
    
    res.json({ totalMovies, totalBookings, totalRevenue });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// Get analytics for Recharts
router.get('/analytics', async (req, res) => {
  try {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const bookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: '$totalAmount' },
          tickets: { $sum: { $size: "$seats" } }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Format for recharts
    const chartData = bookings.map(b => ({
      name: b._id,
      revenue: b.revenue,
      tickets: b.tickets
    }));

    res.json(chartData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// Validate Ticket from QR code
router.post('/validate-ticket', async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    // We didn't add an `isUsed` flag to Booking model earlier, but we can just check if it exists.
    // Let's add a dynamic field or just return the booking details.
    const booking = await Booking.findOne({ paymentId })
      .populate('movie')
      .populate('user', 'email name');
      
    if (!booking) {
      return res.status(404).json({ msg: 'Ticket not found.' });
    }
    
    // In a real app we'd mark it used: 
    // booking.isUsed = true; await booking.save();
    // For now we just return it.
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// ADMIN THEATER REGISTRATION & MANAGEMENT
// ==========================================

// 1. Get all theaters with owner info and stats
router.get('/theaters', async (req, res) => {
  try {
    const theaters = await Theater.find().populate('owner', 'name email role');
    
    // Enrich with showtimes count and bookings count
    const enrichedTheaters = await Promise.all(
      theaters.map(async (th) => {
        const showtimesCount = await Showtime.countDocuments({ theaterId: th._id });
        const showtimes = await Showtime.find({ theaterId: th._id }, '_id');
        const showtimeIds = showtimes.map(s => s._id);
        const bookingsCount = await Booking.countDocuments({ showtime: { $in: showtimeIds } });
        
        return {
          ...th.toObject(),
          stats: {
            showtimesCount,
            bookingsCount
          }
        };
      })
    );

    res.json(enrichedTheaters);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 2. Register a new theater and assign a theater owner account
router.post('/theaters', async (req, res) => {
  const { 
    name, 
    city, 
    location, 
    cancellable = true, 
    amenities = ['M-Ticket', 'Food & Beverage', 'Dolby Atmos'],
    ownerName, 
    ownerEmail, 
    ownerPassword 
  } = req.body;

  try {
    if (!name || !city || !ownerEmail || !ownerPassword) {
      return res.status(400).json({ msg: 'Please provide theater name, city, owner email, and owner password.' });
    }

    // Check if user email already exists
    let existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      return res.status(400).json({ msg: `A user with email "${ownerEmail}" already exists.` });
    }

    // Create the Theater
    const theater = new Theater({
      name,
      city,
      location: location || `${name}, ${city}`,
      cancellable: Boolean(cancellable),
      amenities: amenities && amenities.length > 0 ? amenities : ['M-Ticket', 'Food & Beverage', 'Dolby Atmos']
    });
    await theater.save();

    // Create and hash password for the Theater Owner
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ownerPassword, salt);

    const user = new User({
      name: ownerName || `${name} Partner`,
      email: ownerEmail,
      password: hashedPassword,
      role: 'theater_owner',
      theaterId: theater._id,
      isVerified: true
    });
    await user.save();

    // Link owner to theater
    theater.owner = user._id;
    await theater.save();

    // Seed default showtimes for active movies so the theater is immediately bookable
    const activeMovies = await Movie.find().limit(3);
    const defaultTimes = ['11:00 AM', '02:30 PM', '06:00 PM', '09:30 PM'];
    const formats = ['HDR BY BARCO', 'DOLBY ATMOS 7.1', 'ENG 2D'];

    for (const movie of activeMovies) {
      for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
        const showDate = new Date();
        showDate.setDate(showDate.getDate() + dayOffset);

        for (let i = 0; i < defaultTimes.length; i++) {
          await Showtime.create({
            movieId: movie._id,
            theaterId: theater._id,
            date: showDate,
            time: defaultTimes[i],
            format: formats[i % formats.length],
            pricePremium: 350,
            priceExecutive: 220,
            status: i % 2 === 0 ? 'AVAILABLE' : 'FAST_FILLING'
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      msg: 'Theater registered successfully by admin.',
      theater: {
        ...theater.toObject(),
        owner: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error('Theater registration error:', err.message);
    res.status(500).json({ msg: 'Server error during theater registration: ' + err.message });
  }
});

// 3. Update theater details
router.put('/theaters/:id', async (req, res) => {
  const { name, city, location, cancellable, amenities, ownerName, ownerEmail } = req.body;
  try {
    const theater = await Theater.findById(req.params.id);
    if (!theater) return res.status(404).json({ msg: 'Theater not found' });

    if (name) theater.name = name;
    if (city) theater.city = city;
    if (location) theater.location = location;
    if (cancellable !== undefined) theater.cancellable = Boolean(cancellable);
    if (amenities) theater.amenities = amenities;

    await theater.save();

    // If owner info updated
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
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 4. Reset Theater Owner Password
router.post('/theaters/:id/reset-password', async (req, res) => {
  const { newPassword } = req.body;
  try {
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
    }

    const theater = await Theater.findById(req.params.id);
    if (!theater || !theater.owner) {
      return res.status(404).json({ msg: 'Theater or assigned owner not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(theater.owner, { password: hashedPassword });
    res.json({ success: true, msg: 'Password updated successfully for theater owner.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 5. Delete theater
router.delete('/theaters/:id', async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);
    if (!theater) return res.status(404).json({ msg: 'Theater not found' });

    // Delete showtimes for this theater
    await Showtime.deleteMany({ theaterId: theater._id });

    // Delete owner user account if exists
    if (theater.owner) {
      await User.findByIdAndDelete(theater.owner);
    }

    await Theater.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: 'Theater and associated account deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 6. Presentation Simulator: 1-Click "Live Rush Traffic Simulator"
router.post('/simulate-rush', async (req, res) => {
  try {
    const io = req.app.get('io');
    const { showtimeId } = req.body;

    let targetShowtime = null;
    if (showtimeId) {
      targetShowtime = await Showtime.findById(showtimeId).populate('movieId theaterId');
    }
    if (!targetShowtime) {
      targetShowtime = await Showtime.findOne().populate('movieId theaterId');
    }

    if (!targetShowtime) {
      return res.status(404).json({ msg: 'No active showtime found to simulate.' });
    }

    const showtime = targetShowtime;
    const targetShowtimeId = showtime._id.toString();

    // 3 Simulated concurrent booking sessions
    const simRushes = [
      {
        bot: { name: 'Pooja Verma', email: 'pooja.verma@demo.com' },
        seats: ['A3', 'A4'],
        delayMs: 1500
      },
      {
        bot: { name: 'Karthik Raju', email: 'karthik.raju@demo.com' },
        seats: ['C7', 'C8'],
        delayMs: 4000
      },
      {
        bot: { name: 'Aditi Rao', email: 'aditi.rao@demo.com' },
        seats: ['D5', 'D6'],
        delayMs: 7000
      }
    ];

    // Asynchronously run simulation in the background
    (async () => {
      for (const rush of simRushes) {
        await new Promise(r => setTimeout(r, rush.delayMs));

        const { bot, seats } = rush;
        const amount = seats.length * (showtime.pricePremium || 350);

        // Step A: Broadcast temporary locks to showtime room
        if (io) {
          seats.forEach(s => {
            io.to(`showtime_${targetShowtimeId}`).emit('seat_locked_by_other', {
              seatId: s,
              socketId: `sim_bot_${Date.now()}`,
              userId: bot.email
            });
          });

          // Telemetry audit log
          io.to('admin_feed').emit('admin_audit_event', {
            id: `sim_lock_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            type: 'LOCK',
            message: `[Simulated User] ${bot.name} held seats [${seats.join(', ')}] (8m TTL)`,
            meta: { seats, bot: bot.email }
          });
        }

        // Step B: Simulate checkout & payment after 2.5 seconds
        await new Promise(r => setTimeout(r, 2500));

        let user = await User.findOne({ email: bot.email });
        if (!user) {
          user = await User.create({
            name: bot.name,
            email: bot.email,
            password: 'demopassword123',
            isVerified: true
          });
        }

        const booking = await Booking.create({
          user: user._id,
          movie: showtime.movieId?._id,
          showtime: showtime._id,
          seats,
          totalAmount: amount,
          paymentId: `sim_pay_${Date.now()}`
        });

        if (io) {
          // Permanently lock seats in showtime room
          io.to(`showtime_${targetShowtimeId}`).emit('seats_permanently_booked', {
            showtimeId: targetShowtimeId,
            seats
          });

          const bookingAlert = {
            bookingId: booking._id,
            movieTitle: showtime.movieId?.title || 'Live Rush Movie',
            theaterName: showtime.theaterId?.name || 'Partner Cinema',
            theaterId: showtime.theaterId?._id,
            seats,
            amount,
            userEmail: bot.email,
            createdAt: new Date().toISOString()
          };

          // Admin and partner notification toasts
          io.to('admin_feed').emit('new_live_booking', bookingAlert);
          io.emit('new_live_booking', bookingAlert);

          // Telemetry audit log
          io.to('admin_feed').emit('admin_audit_event', {
            id: `sim_book_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            type: 'BOOK',
            message: `[Live Admission] ${bot.name} paid ₹${amount} for seats [${seats.join(', ')}]`,
            meta: { bookingId: booking._id, seats, amount }
          });
        }
      }
    })();

    res.json({
      success: true,
      msg: 'Live Rush Simulation launched! 3 concurrent user sessions are reserving seats live.',
      showtime: {
        id: showtime._id,
        movie: showtime.movieId?.title,
        theater: showtime.theaterId?.name,
        time: showtime.time
      }
    });
  } catch (err) {
    console.error('Simulation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


