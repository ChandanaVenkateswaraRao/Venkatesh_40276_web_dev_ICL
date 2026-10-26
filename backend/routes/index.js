const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const movieRoutes = require('./movies');
const paymentRoutes = require('./payment');
const adminRoutes = require('./admin');
const theaterRoutes = require('./theaters');
const giftCardRoutes = require('./giftcards');
const walletRoutes = require('./wallet');

router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/payment', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/theaters', theaterRoutes);
router.use('/giftcards', giftCardRoutes);
router.use('/wallet', walletRoutes);

module.exports = router;
