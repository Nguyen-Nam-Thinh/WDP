const { ZodError } = require('zod');
const { sendError } = require('../utils/response');

function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        sendError(res, 422, 'Validation failed', errors);
        return;
      }
      next(error);
    }
  };
}

module.exports = { validate };
