const { z } = require('zod');

const createShowtimeSchema = z.object({
  movieId: z.string().trim().min(1, { message: 'Movie ID is required' }),
  theaterId: z.string().trim().optional(),
  date: z.string().trim().min(1, { message: 'Showtime date is required' }),
  time: z.string().trim().min(1, { message: 'Showtime time is required' }),
  format: z.string().trim().optional().default('HDR BY BARCO'),
  screen: z.string().trim().optional().default('Audi 1'),
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
