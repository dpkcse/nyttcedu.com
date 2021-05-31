var express = require('express');
var router = express.Router();
const HomeController = require('../../controllers/front_controller/HomeController');

router.get('/', HomeController.HomeLanding);

module.exports = router;
