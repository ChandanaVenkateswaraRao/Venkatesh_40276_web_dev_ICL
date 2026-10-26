const { z } = require('zod');

const createOrderSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Order amount must be a positive number' })
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(1, { message: 'Order ID is required' }),
  razorpay_payment_id: z.string().trim().min(1, { message: 'Payment ID is required' }),
  razorpay_signature: z.string().trim().min(1, { message: 'Signature is required' }),
  movieId: z.string().trim().min(1, { message: 'Movie ID is required' }),
  showtimeId: z.string().trim().optional().nullable(),
  seats: z.array(z.string()).min(1, { message: 'At least one seat must be selected' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive' }),
  walletAmountToDeduct: z.coerce.number().min(0).optional().default(0)
});

const payWithWalletSchema = z.object({
  movieId: z.string().trim().min(1, { message: 'Movie ID is required' }),
  showtimeId: z.string().trim().optional().nullable(),
  seats: z.array(z.string()).min(1, { message: 'At least one seat must be selected' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive' })
});

module.exports = {
  createOrderSchema,
  verifyPaymentSchema,
  payWithWalletSchema
};
