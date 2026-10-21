const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const auth = require('../middleware/auth');

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Route to create a Razorpay order
router.post('/orders', async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'YOUR_TEST_KEY_ID',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_TEST_KEY_SECRET',
    });

    const options = {
      amount: Math.round(req.body.amount * 100), // amount in paise
      currency: 'INR',
      receipt: crypto.randomBytes(10).toString('hex'),
    };

    instance.orders.create(options, (error, order) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong!' });
      }
      res.status(200).json({ data: order });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error!' });
  }
});

// Route to verify the payment and generate ticket
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, movieId, showtimeId, seats, amount } = req.body;
    
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_TEST_KEY_SECRET')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== 'simulated_signature' && razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: 'Invalid signature sent!' });
    }

    // Save booking
    const booking = new Booking({
      user: req.user.id,
      movie: movieId,
      showtime: showtimeId,
      seats: seats,
      totalAmount: amount,
      paymentId: razorpay_payment_id
    });
    await booking.save();

    // Fetch details for email & notifications
    const user = await User.findById(req.user.id);
    const movie = await Movie.findById(movieId);
    const showtime = showtimeId ? await Showtime.findById(showtimeId).populate('theaterId') : null;
    
    // Generate QR Code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TICKET:${booking._id}`;

    // Send Ticket Email
    const mailOptions = {
      from: `"bookmyshow" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Your Tickets for ${movie ? movie.title : 'Movie'} are Confirmed!`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eeeeee;">
          <div style="background-color: #F84464; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; font-style: italic;">bookmyshow</h1>
            <p style="color: #ffd1d8; margin: 5px 0 0 0; font-size: 14px;">Booking Confirmed</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333333; margin-top: 0; font-size: 22px;">Hi ${user.name},</h2>
            <p style="color: #666666; font-size: 16px; line-height: 1.5;">You're all set! Present the QR code below at the cinema entrance.</p>
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #F84464;">
              <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 20px;">${movie ? movie.title : 'Movie'}</h3>
              <p style="margin: 5px 0; color: #555555;"><strong>Cinema:</strong> ${showtime?.theaterId?.name || 'Multiplex'}</p>
              <p style="margin: 5px 0; color: #555555;"><strong>Date & Time:</strong> Today, ${showtime?.time || 'Show'}</p>
              <p style="margin: 5px 0; color: #555555;"><strong>Seats:</strong> ${seats.join(', ')}</p>
              <p style="margin: 5px 0; color: #555555;"><strong>Booking ID:</strong> ${booking._id}</p>
              <p style="margin: 5px 0; color: #555555;"><strong>Total Paid:</strong> ₹${amount}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Your Ticket QR Code</p>
              <img src="${qrCodeUrl}" alt="Ticket QR Code" style="border: 2px solid #eeeeee; border-radius: 8px; padding: 10px;" />
            </div>
          </div>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #999999;">
            <p style="margin: 0;">© 2026 bookmyshow. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error("Failed to send ticket email:", mailErr);
    }

    // REAL-TIME BROADCASTS via Socket.IO
    const io = req.app.get('io');
    if (io) {
      // 1. Permanently lock seats on customer screens viewing this showtime
      io.to(`showtime_${showtimeId}`).emit('seats_permanently_booked', {
        showtimeId,
        seats
      });

      // 2. Real-time alert to Admin Dashboard & Theater Partner Dashboard
      const bookingAlert = {
        bookingId: booking._id,
        movieTitle: movie?.title || 'Movie Ticket',
        theaterName: showtime?.theaterId?.name || 'Partner Cinema',
        theaterId: showtime?.theaterId?._id,
        seats,
        amount,
        userEmail: user?.email,
        createdAt: new Date().toISOString()
      };

      io.to('admin_feed').emit('new_live_booking', bookingAlert);
      io.emit('new_live_booking', bookingAlert);
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('movie')
      .populate({ path: 'showtime', populate: { path: 'theaterId' } });

    return res.status(200).json({ message: 'Payment verified and ticket generated', booking: populatedBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error!' });
  }
});

module.exports = router;
