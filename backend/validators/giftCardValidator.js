const { z } = require('zod');

const createGiftCardOrderSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Gift card amount must be a positive number' }),
  quantity: z.coerce.number().int().min(1).default(1)
});

const verifyGiftCardSchema = z.object({
  razorpay_order_id: z.string().trim().min(1, { message: 'Order ID is required' }),
  razorpay_payment_id: z.string().trim().min(1, { message: 'Payment ID is required' }),
  razorpay_signature: z.string().trim().min(1, { message: 'Payment signature is required' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive' }),
  quantity: z.coerce.number().int().min(1).optional().default(1),
  theme: z.any().optional(),
  recipientName: z.string().optional(),
  recipientEmail: z.string().optional(),
  senderName: z.string().optional(),
  message: z.string().optional()
});

const checkBalanceSchema = z.object({
  cardNumber: z.string().trim().min(8, { message: 'Valid card number is required' }),
  pin: z.string().trim().min(4, { message: '4-digit security PIN is required' })
});

const redeemGiftCardSchema = z.object({
  cardNumber: z.string().trim().min(8, { message: 'Valid card number is required' }),
  pin: z.string().trim().min(4, { message: '4-digit security PIN is required' }),
  amount: z.coerce.number().positive().optional()
});

module.exports = {
  createGiftCardOrderSchema,
  verifyGiftCardSchema,
  checkBalanceSchema,
  redeemGiftCardSchema
};
