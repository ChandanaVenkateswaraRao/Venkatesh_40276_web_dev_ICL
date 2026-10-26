const express = require('express');
const router = express.Router();
const giftCardController = require('../controllers/giftCardController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const {
  createGiftCardOrderSchema,
  verifyGiftCardSchema,
  checkBalanceSchema,
  redeemGiftCardSchema
} = require('../validators/giftCardValidator');

// Razorpay Order for Gift Card Purchase
router.post('/orders', validate(createGiftCardOrderSchema), giftCardController.createGiftCardOrder);

// Verify Razorpay Payment & Issue Gift Card
router.post('/verify', validate(verifyGiftCardSchema), giftCardController.verifyGiftCardPurchase);

// Check Balance & Status of Gift Card
router.post('/check-balance', validate(checkBalanceSchema), giftCardController.checkCardBalance);

// Redeem Gift Card into Wallet
router.post('/redeem', auth, validate(redeemGiftCardSchema), giftCardController.redeemGiftCard);

module.exports = router;
