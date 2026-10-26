const { z } = require('zod');

const screenSchema = z.object({
  screenNumber: z.coerce.number().min(1).default(1),
  name: z.string().trim().min(1, { message: 'Screen name is required' }),
  screenType: z.string().trim().min(1).default('Standard 2D'),
  capacity: z.coerce.number().min(10).default(150)
});

const createTheaterSchema = z.object({
  name: z.string().trim().min(2, { message: 'Theater name must be at least 2 characters' }),
  city: z.string().trim().min(1, { message: 'City is required' }),
  location: z.string().trim().min(1, { message: 'Location is required' }),
  theaterType: z.enum(['single_screen', 'multiplex']).optional().default('multiplex'),
  screens: z.array(screenSchema).optional(),
  cancellable: z.boolean().optional().default(true),
  amenities: z.array(z.string()).optional().default(['M-Ticket', 'Food & Beverage', 'Dolby Atmos']),
  ownerName: z.string().trim().min(2, { message: 'Owner name must be at least 2 characters' }),
  ownerEmail: z.string().trim().email({ message: 'Valid owner email is required' }),
  ownerPassword: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

const updateTheaterSchema = z.object({
  name: z.string().trim().min(2).optional(),
  city: z.string().trim().min(1).optional(),
  location: z.string().trim().optional(),
  theaterType: z.enum(['single_screen', 'multiplex']).optional(),
  screens: z.array(screenSchema).optional(),
  cancellable: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
  ownerName: z.string().trim().optional(),
  ownerEmail: z.string().trim().email().optional()
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

const validateTicketSchema = z.object({
  paymentId: z.string().trim().min(1, { message: 'Payment or Ticket identifier is required' })
});

module.exports = {
  createTheaterSchema,
  updateTheaterSchema,
  resetPasswordSchema,
  validateTicketSchema
};
