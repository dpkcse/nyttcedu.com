var express = require('express');
var router = express.Router();
const CareerController = require('../../controllers/front_controller/CareerController');

router.get('/', CareerController.JobVacancy);

module.exports = router;