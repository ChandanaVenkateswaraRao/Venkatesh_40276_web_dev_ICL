const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Theater = require('../models/Theater');
const Booking = require('../models/Booking');

// Email transporter config
const transporter = nodemailer.createTransport({
  service: 'gmail',
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

// 1. Register User
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ success: false, msg: 'User already exists' });
      }
    } else {
      user = new User({ name, email, password });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    console.log(`\n========================================`);
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    console.log(`========================================\n`);

    try {
      await sendOTPEmail(email, name, otp);
      return res.json({ success: true, msg: 'OTP sent to email', requireOtp: true });
    } catch (mailError) {
      console.error('Mail Error (check SMTP credentials):', mailError.message);
      return res.json({
        success: true,
        msg: 'Mail service unavailable in dev mode, OTP printed to console',
        requireOtp: true
      });
    }
  } catch (err) {
    next(err);
  }
};

// 2. Verify OTP
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, msg: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, msg: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

// 3. Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, msg: 'Invalid Credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, msg: 'Please verify your email first' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        theaterId: user.theaterId
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance || 0,
        theaterId: user.theaterId
      }
    });
  } catch (err) {
    next(err);
  }
};

// 4. Partner/Theater Owner Register
const partnerRegister = async (req, res, next) => {
  try {
    const { name, email, password, theaterName, city, location, amenities } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ success: false, msg: 'A user with this email already exists' });
    }

    // Find or create theater
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

    theater.owner = user._id;
    await theater.save();

    const payload = {
      user: {
        id: user.id,
        role: 'theater_owner',
        theaterId: theater._id
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
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
  } catch (err) {
    next(err);
  }
};

// 5. Partner/Theater Owner Login
const partnerLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, msg: 'Invalid Partner Credentials' });
    }

    if (user.role !== 'theater_owner' && user.role !== 'admin') {
      return res.status(403).json({ success: false, msg: 'This account does not have Theater Partner privileges.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, msg: 'Invalid Credentials' });
    }

    let theater = null;
    if (user.theaterId) {
      theater = await Theater.findById(user.theaterId);
    } else {
      theater = await Theater.findOne({ owner: user._id });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        theaterId: theater ? theater._id : null
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
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
  } catch (err) {
    next(err);
  }
};

// 6. Get Current User Profile & Bookings
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }
    const bookings = await Booking.find({ user: req.user.id })
      .populate('movie')
      .populate({ path: 'showtime', populate: { path: 'theaterId' } })
      .sort({ createdAt: -1 });

    res.json({ user, bookings });
  } catch (err) {
    next(err);
  }
};

// 7. Update User Profile
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }
    await user.save();

    res.json({ success: true, msg: 'Profile updated successfully', user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  partnerRegister,
  partnerLogin,
  getProfile,
  updateProfile
};
