const router = require('express').Router();

router.use('/room-types', require('./roomType.routes'));
router.use('/bookings', require('./booking.routes'));
router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;
