const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const auth = require('../middleware/auth');

// Get current user's wallet balance and transactions
router.get('/balance', auth, walletController.getWalletDetails);

module.exports = router;
