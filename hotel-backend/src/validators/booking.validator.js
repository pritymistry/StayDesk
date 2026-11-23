const Joi = require('joi');
const { today, isValidDate, nightsBetween } = require('../utils/dates');

const MAX_NIGHTS = 30;

const dateField = (label) =>
  Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .custom((value, helpers) => (isValidDate(value) ? value : helpers.error('any.invalid')))
    .required()
    .label(label)
    .messages({
      'string.pattern.base': '{{#label}} must be in YYYY-MM-DD format',
      'any.invalid': '{{#label}} is not a valid date',
    });

const createBookingSchema = Joi.object({
  guest_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[A-Za-z .'-]+$/)
    .required()
    .label('Guest name')
    .messages({ 'string.pattern.base': '{{#label}} can only contain letters and spaces' }),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .required()
    .label('Phone')
    .messages({ 'string.pattern.base': 'Phone must be a 10-digit number' }),
  email: Joi.string().trim().email({ tlds: { allow: false } }).max(100).required().label('Email'),
  room_type_id: Joi.number().integer().positive().required().label('Room type'),
  check_in: dateField('Check-in date'),
  check_out: dateField('Check-out date'),
}).custom((value, helpers) => {
  const { check_in, check_out } = value;
  if (typeof check_in !== 'string' || typeof check_out !== 'string') return value;
  if (!isValidDate(check_in) || !isValidDate(check_out)) return value; // field errors already reported

  if (check_in < today()) return helpers.message('Check-in date cannot be in the past');
  if (check_out <= check_in) return helpers.message('Check-out date must be after check-in date');
  if (nightsBetween(check_in, check_out) > MAX_NIGHTS) {
    return helpers.message(`Maximum stay is ${MAX_NIGHTS} nights`);
  }
  return value;
});

module.exports = { createBookingSchema };
