const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

// Email transporter config
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this or configure host/port
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Utility to send email with custom template
const sendOTPEmail = async (email, name, otp) => {
  const mailOptions = {
    from: `"bookmyshow" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email Address - bookmyshow',
    html: `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #F84464; text-align: center;">Welcome to bookmyshow, ${name}!</h2>
        <p style="color: #333; font-size: 16px;">We are thrilled to have you. Please verify your email address to complete your registration.</p>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #777;">Your One-Time Password (OTP) is:</p>
          <h1 style="margin: 10px 0 0 0; color: #333; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p style="color: #666; font-size: 14px; text-align: center;">This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      if (user.isVerified) return res.status(400).json({ msg: 'User already exists' });
      // If user exists but not verified, we can resend OTP (simplified here by overwriting)
    } else {
      user = new User({ name, email, password });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();
    
    // Attempt to send email, catch to gracefully tell frontend it's a test env
    console.log(`\n========================================`);
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    console.log(`========================================\n`);
    
    try {
      await sendOTPEmail(email, name, otp);
      res.json({ msg: 'OTP sent to email', requireOtp: true });
    } catch (mailError) {
      console.error("Mail Error (Check SMTP credentials): ", mailError);
      // In dev environment, if mail fails, just print OTP in console
      console.log(`[DEV OTP for ${email}]: ${otp}`);
      res.json({ msg: 'Mail failed but OTP printed in console for dev', requireOtp: true });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });
    
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }
    
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });
    
    if (!user.isVerified) {
      return res.status(403).json({ msg: 'Please verify your email first' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { 
      user: { 
        id: user.id,
        role: user.role,
        theaterId: user.theaterId
      } 
    };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 86400 }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          theaterId: user.theaterId
        }
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Partner/Theater Owner Register
const Theater = require('../models/Theater');

router.post('/partner/register', async (req, res) => {
  const { name, email, password, theaterName, city, location, amenities } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'A user with this email already exists' });
    }

    // Find or create the theater
    let theater = await Theater.findOne({ name: theaterName, city });
    if (!theater) {
      theater = new Theater({
        name: theaterName,
        city: city || 'Hyderabad',
        location: location || `${theaterName}, ${city || 'Hyderabad'}`,
        cancellable: true,
        amenities: amenities || ['M-Ticket', 'Food & Beverage', 'Dolby Atmos']
      });
      await theater.save();
    }

    user = new User({
      name,
      email,
      password,
      role: 'theater_owner',
      theaterId: theater._id,
      isVerified: true
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Link theater owner
    theater.owner = user._id;
    await theater.save();

    const payload = { 
      user: { 
        id: user.id,
        role: 'theater_owner',
        theaterId: theater._id
      } 
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 86400 }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'theater_owner',
          theaterId: theater._id,
          theater
        }
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Partner/Theater Owner Login
router.post('/partner/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Partner Credentials' });

    if (user.role !== 'theater_owner' && user.role !== 'admin') {
      return res.status(403).json({ msg: 'This account does not have Theater Partner privileges.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    let theater = null;
    if (user.theaterId) {
      theater = await Theater.findById(user.theaterId);
    } else {
      // Find a theater owned by this user
      theater = await Theater.findOne({ owner: user._id });
    }

    const payload = { 
      user: { 
        id: user.id,
        role: user.role,
        theaterId: theater ? theater._id : null
      } 
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 86400 }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          theaterId: theater ? theater._id : null,
          theater
        }
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

const auth = require('../middleware/auth');
const Booking = require('../models/Booking');

// Profile Route
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const bookings = await Booking.find({ user: req.user.id }).populate('movie').sort({ createdAt: -1 });
    res.json({ user, bookings });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
