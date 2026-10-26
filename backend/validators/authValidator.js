const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().trim().email({ message: 'Please provide a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' })
});

const verifyOtpSchema = z.object({
  email: z.string().trim().email({ message: 'Please provide a valid email address' }),
  otp: z.string().trim().min(4, { message: 'OTP is required' })
});

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please provide a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' })
});

const partnerRegisterSchema = z.object({
  name: z.string().trim().min(2, { message: 'Partner name must be at least 2 characters' }),
  email: z.string().trim().email({ message: 'Valid partner email is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  theaterName: z.string().trim().min(2, { message: 'Theater name is required' }),
  city: z.string().trim().optional().default('Hyderabad'),
  location: z.string().trim().optional(),
  amenities: z.array(z.string()).optional()
});

const partnerLoginSchema = z.object({
  email: z.string().trim().email({ message: 'Please provide a valid partner email' }),
  password: z.string().min(1, { message: 'Password is required' })
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters long' }).optional()
});

module.exports = {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  partnerRegisterSchema,
  partnerLoginSchema,
  updateProfileSchema
};
