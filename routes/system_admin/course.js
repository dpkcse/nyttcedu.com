var express = require('express');
var router = express.Router();
const { forwardAuthenticated, ensureAuthenticated } = require("../../config/auth");
const CourseController = require('../../controllers/system_admin/CourseController');


router.get('/', ensureAuthenticated, CourseController.CourseGet);
router.post('/add-course', ensureAuthenticated, CourseController.SaveNewCourseInfo);

module.exports = router;