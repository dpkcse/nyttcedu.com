var express = require('express');
var router = express.Router();
const ContactController = require('../../controllers/front_controller/ContactController');

router.get('/', ContactController.ContactView);
router.post('/', ContactController.SendMessage);

router.post('/subscribe', ContactController.SubscribeEmail);

module.exports = router;