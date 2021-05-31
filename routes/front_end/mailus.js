var express = require('express');
var router = express.Router();
const MailusController = require('../../controllers/front_controller/MailusController');

router.get('/', MailusController.Mailus);

module.exports = router;