const Joi = require('joi');

const roomTypeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().label('Room type name'),
  price_per_night: Joi.number().positive().precision(2).max(1000000).required().label('Price per night'),
  total_rooms: Joi.number().integer().min(1).max(1000).required().label('Total rooms'),
});

module.exports = { roomTypeSchema };
