const mongoose = require('mongoose');

const CorporateBookingSchema = new mongoose.Schema({
  refId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  contactName: {
    type: String,
    required: true
  },
  workEmail: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  gstin: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    required: true,
    default: 'Bengaluru'
  },
  serviceType: {
    type: String,
    required: true,
    default: 'Private Auditorium Screening'
  },
  theaterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater'
  },
  theaterName: {
    type: String,
    default: ''
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie'
  },
  movieTitle: {
    type: String,
    default: ''
  },
  screenFormat: {
    type: String,
    default: 'Standard 2D Luxe'
  },
  attendees: {
    type: Number,
    required: true,
    default: 50
  },
  preferredDate: {
    type: String,
    default: ''
  },
  preferredTimeSlot: {
    type: String,
    default: 'Prime Evening (06:30 PM - 10:00 PM)'
  },
  includeSnacks: {
    type: Boolean,
    default: true
  },
  snackPackage: {
    type: String,
    default: 'Executive Bento Box (Popcorn + Nachos + Beverage)'
  },
  includePresentationKit: {
    type: Boolean,
    default: false
  },
  pricing: {
    ticketSubtotal: Number,
    snacksSubtotal: Number,
    brandingSubtotal: Number,
    bulkDiscountPercent: Number,
    bulkDiscountAmount: Number,
    subtotalAfterDiscount: Number,
    gstAmount: Number,
    totalAmount: Number,
    perPersonEstimate: Number
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['INQUIRY_RECEIVED', 'DRAFT_PROPOSAL_GENERATED', 'THEATER_SLOT_HELD', 'CONFIRMED', 'COMPLETED'],
    default: 'INQUIRY_RECEIVED'
  },
  accountManager: {
    name: { type: String, default: 'Vikramaditya Sen' },
    role: { type: String, default: 'National Head - Corporate Client Experience' },
    phone: { type: String, default: '+91 91234 56789' },
    email: { type: String, default: 'corporates@bookmyshow.icl' },
    whatsapp: { type: String, default: '+919123456789' },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
  },
  history: [{
    status: String,
    note: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CorporateBooking', CorporateBookingSchema);
