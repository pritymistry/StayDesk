const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/roomType.service');

exports.getAll = asyncHandler(async (req, res) => {
  const data = await service.getAll();
  res.json({ success: true, data });
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await service.getById(req.params.id);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.create(req.body);
  res.status(201).json({ success: true, message: 'Room type created', data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  res.json({ success: true, message: 'Room type updated', data });
});
