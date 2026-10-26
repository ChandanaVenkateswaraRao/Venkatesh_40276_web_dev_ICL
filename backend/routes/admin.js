const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const validate = require('../middleware/validate');
const {
  createTheaterSchema,
  updateTheaterSchema,
  resetPasswordSchema,
  validateTicketSchema
} = require('../validators/adminValidator');
const { createShowtimeSchema } = require('../validators/theaterValidator');

// Dashboard & Analytics
router.get('/bookings', adminController.getAllBookings);
router.get('/dashboard', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);

// QR Ticket Validation
router.post('/validate-ticket', validate(validateTicketSchema), adminController.validateTicket);

// Theater Partner Management
router.get('/theaters', adminController.getAllTheaters);
router.post('/theaters', validate(createTheaterSchema), adminController.createTheater);
router.put('/theaters/:id', validate(updateTheaterSchema), adminController.updateTheater);
router.post('/theaters/:id/reset-password', validate(resetPasswordSchema), adminController.resetPartnerPassword);
router.delete('/theaters/:id', adminController.deleteTheater);

// Show Scheduling
router.post('/add-show', validate(createShowtimeSchema), adminController.addShow);

// Concurrency Simulator & Telemetry
router.post('/simulate-traffic', adminController.simulateTraffic);
router.post('/clear-demo-bookings', adminController.clearDemoBookings);
router.get('/telemetry-stats', adminController.getTelemetryStats);

module.exports = router;
