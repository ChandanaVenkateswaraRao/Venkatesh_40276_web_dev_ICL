const { z } = require('zod');

const createMovieSchema = z.object({
  title: z.string().trim().min(1, { message: 'Movie title is required' }),
  image: z.string().trim().min(1, { message: 'Movie poster image URL is required' }),
  genre: z.string().trim().min(1, { message: 'Genre is required' }),
  language: z.string().trim().min(1, { message: 'Language is required' }),
  rating: z.coerce.number().min(0).max(10).default(8.0),
  trailerUrl: z.string().trim().optional().default('https://www.youtube.com/embed/dQw4w9WgXcQ'),
  cities: z.array(z.string()).optional().default(['Hyderabad', 'Mumbai', 'Bengaluru']),
  initialShowtime: z.object({
    theaterId: z.string().trim().min(1),
    date: z.string().trim().min(1),
    time: z.string().trim().min(1),
    format: z.string().trim().optional(),
    screen: z.string().trim().optional(),
    pricePremium: z.coerce.number().optional(),
    priceExecutive: z.coerce.number().optional()
  }).optional()
});

const createReviewSchema = z.object({
  rating: z.coerce.number().min(1, { message: 'Rating must be at least 1' }).max(10, { message: 'Rating cannot exceed 10' }),
  text: z.string().trim().min(2, { message: 'Review commentary must be at least 2 characters long' })
});

module.exports = {
  createMovieSchema,
  createReviewSchema
};
