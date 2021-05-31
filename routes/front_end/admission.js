var express = require('express');
var router = express.Router();
const AdmissionController = require('../../controllers/front_controller/AdmissionController');

router.get('/', AdmissionController.AdmissionForm);

module.exports = router;