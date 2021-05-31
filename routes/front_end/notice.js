var express = require('express');
var router = express.Router();
const NoticeController = require('../../controllers/front_controller/NoticeController');

router.get('/', NoticeController.NoticeView);

module.exports = router;