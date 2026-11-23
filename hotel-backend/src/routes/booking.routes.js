const router = require('express').Router();
const controller = require('../controllers/booking.controller');
const { validate, validateId } = require('../middleware/validate');
const { createBookingSchema } = require('../validators/booking.validator');

router.get('/availability', controller.checkAvailability);
router.get('/', controller.getAll);                                   // ?status=CONFIRMED|CHECKED_IN|CHECKED_OUT|CANCELLED
router.post('/', validate(createBookingSchema), controller.create);
router.get('/:id', validateId, controller.getById);
router.get('/:id/bill', validateId, controller.getBill);
router.patch('/:id/check-in', validateId, controller.checkIn);
router.patch('/:id/check-out', validateId, controller.checkOut);
router.patch('/:id/cancel', validateId, controller.cancel);
router.patch('/:id/status', validateId, controller.updateStatus);

module.exports = router;
