var express = require('express');
var router = express.Router();
const FaqController = require('../../controllers/front_controller/FaqController');

router.get('/', FaqController.FaqViewController);

module.exports = router;