const { z } = require('zod');

const createShowtimeSchema = z.object({
  movieId: z.string({ required_error: 'Please select a movie to schedule' })
    .trim()
    .min(1, { message: 'Movie selection is required' }),
  theaterId: z.string().trim().optional(),
  date: z.string().trim().optional(),
  time: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  days: z.coerce.number().min(1).max(30).optional(),
  times: z.array(z.string().trim()).optional(),
  format: z.string().trim().optional().default('Dolby Atmos'),
  screen: z.string().trim().optional().default('Screen 1'),
  pricePremium: z.coerce.number().min(0).default(350),
  priceExecutive: z.coerce.number().min(0).default(200)
});

const updatePriceSchema = z.object({
  pricePremium: z.coerce.number().min(0).optional(),
  priceExecutive: z.coerce.number().min(0).optional()
});

const partnerAddMovieSchema = z.object({
  title: z.string().trim().min(1, { message: 'Title is required' }),
  image: z.string().trim().min(1, { message: 'Image URL is required' }),
  genre: z.string().trim().min(1, { message: 'Genre is required' }),
  language: z.string().trim().min(1, { message: 'Language is required' }),
  rating: z.coerce.number().min(0).max(10).optional().default(8.5),
  trailerUrl: z.string().trim().optional()
});

const saveScreenLayoutSchema = z.object({
  screenNumber: z.coerce.number().optional(),
  screenName: z.string().trim().optional(),
  name: z.string().trim().optional(),
  rows: z.coerce.number().min(1, 'At least 1 row is required').max(30, 'Maximum 30 rows allowed'),
  cols: z.coerce.number().min(1, 'At least 1 column is required').max(40, 'Maximum 40 columns allowed'),
  rowLabels: z.array(z.string()).optional(),
  deletedSeats: z.array(z.string()).optional().default([]),
  tierConfig: z.object({
    reclinerRows: z.array(z.string()).optional().default([]),
    premiumRows: z.array(z.string()).optional().default([]),
    executiveRows: z.array(z.string()).optional().default([])
  }).optional()
});

module.exports = {
  createShowtimeSchema,
  updatePriceSchema,
  partnerAddMovieSchema,
  saveScreenLayoutSchema
};
