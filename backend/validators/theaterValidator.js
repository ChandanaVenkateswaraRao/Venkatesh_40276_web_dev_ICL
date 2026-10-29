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

module.exports = {
  createShowtimeSchema,
  updatePriceSchema,
  partnerAddMovieSchema
};
