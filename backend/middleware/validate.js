const { ZodError } = require('zod');

/**
 * Zod validation middleware factory
 * @param {import('zod').ZodSchema} schema - Zod validation schema
 * @param {'body' | 'query' | 'params'} source - Request property to validate (default: 'body')
 */
const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        const primaryMessage = formattedErrors[0]?.message || 'Validation failed';

        return res.status(400).json({
          success: false,
          msg: primaryMessage,
          message: primaryMessage,
          errors: formattedErrors
        });
      }

      next(error);
    }
  };
};

module.exports = validate;
