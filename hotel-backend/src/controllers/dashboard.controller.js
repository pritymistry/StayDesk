const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/dashboard.service');

exports.getSummary = asyncHandler(async (req, res) => {
  const data = await service.getSummary();
  res.json({ success: true, data });
});
