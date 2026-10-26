const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { createOrderSchema, verifyPaymentSchema, payWithWalletSchema } = require('../validators/paymentValidator');

// Razorpay Order Creation
router.post('/orders', validate(createOrderSchema), paymentController.createOrder);

// Verified Payment & Ticket Confirmation (with optional wallet split)
router.post('/verify', auth, validate(verifyPaymentSchema), paymentController.verifyPayment);

// Direct 100% Wallet Payment & Ticket Confirmation
router.post('/pay-with-wallet', auth, validate(payWithWalletSchema), paymentController.payWithWallet);

module.exports = router;
