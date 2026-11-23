const AppError = require('../utils/AppError');

// Validates req.body against a Joi schema
const validate = (schema) => (req, res, next) => {
  const { value, error } = schema.validate(req.body, {
    abortEarly: false,   // report all errors at once
    stripUnknown: true,  // drop fields we don't expect
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.') || 'body',
      message: d.message.replace(/"/g, ''),
    }));
    return next(new AppError('Validation failed', 400, errors));
  }

  req.body = value;
  next();
};

// Validates :id in the URL
const validateId = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return next(new AppError('Invalid id', 400));
  }
  req.params.id = id;
  next();
};

module.exports = { validate, validateId };
