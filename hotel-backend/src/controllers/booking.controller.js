const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/booking.service');

exports.getAll = asyncHandler(async (req, res) => {
  const data = await service.getAll({ status: req.query.status });
  res.json({ success: true, data });
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await service.getById(req.params.id);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.create(req.body);
  res.status(201).json({ success: true, message: 'Booking created', data });
});

exports.getBill = asyncHandler(async (req, res) => {
  const data = await service.getBill(req.params.id);
  res.json({ success: true, data });
});

exports.checkIn = asyncHandler(async (req, res) => {
  const data = await service.checkIn(req.params.id);
  res.json({ success: true, message: 'Guest checked in successfully', data });
});

exports.checkOut = asyncHandler(async (req, res) => {
  const data = await service.checkOut(req.params.id);
  res.json({ success: true, message: 'Guest checked out successfully', data });
});

exports.cancel = asyncHandler(async (req, res) => {
  const data = await service.cancel(req.params.id);
  res.json({ success: true, message: 'Booking cancelled', data });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const data = await service.updateStatus(req.params.id, req.body.status);
  res.json({ success: true, message: `Status updated to ${data.status}`, data });
});

exports.checkAvailability = asyncHandler(async (req, res) => {
  const { room_type_id, check_in, check_out } = req.query;
  const data = await service.checkAvailability(room_type_id, check_in, check_out);
  res.json({ success: true, data });
});
