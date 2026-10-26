const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  partnerRegisterSchema,
  partnerLoginSchema,
  updateProfileSchema
} = require('../validators/authValidator');

// User Registration & Verification
router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/login', validate(loginSchema), authController.login);

// Theater Partner Portal Authentication
router.post('/partner/register', validate(partnerRegisterSchema), authController.partnerRegister);
router.post('/partner/login', validate(partnerLoginSchema), authController.partnerLogin);

// Customer Profile
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
