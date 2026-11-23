const router = require('express').Router();
const controller = require('../controllers/roomType.controller');
const { validate, validateId } = require('../middleware/validate');
const { roomTypeSchema } = require('../validators/roomType.validator');

router.get('/', controller.getAll);
router.get('/:id', validateId, controller.getById);
router.post('/', validate(roomTypeSchema), controller.create);
router.put('/:id', validateId, validate(roomTypeSchema), controller.update);

module.exports = router;
