var express = require('express');
var router = express.Router();
const CourseFrontController = require('../../controllers/front_controller/CourseFrontController');

router.get('/', CourseFrontController.GetCourseListController);

module.exports = router;