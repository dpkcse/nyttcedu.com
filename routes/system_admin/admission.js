var express = require('express');
var router = express.Router();
const { forwardAuthenticated, ensureAuthenticated } = require("../../config/auth");
const AdmissionController = require('../../controllers/system_admin/AdmissionController');


// router.get('/add-student', ensureAuthenticated, AdmissionController.AddStudentGet);
router.get('/asign-course', ensureAuthenticated, AdmissionController.AsignCourseGet);



module.exports = router;