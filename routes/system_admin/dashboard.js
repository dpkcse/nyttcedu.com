var express = require('express');
var router = express.Router();
const { forwardAuthenticated, ensureAuthenticated } = require("../../config/auth");
const DashboardController = require('../../controllers/system_admin/DashboardController');


router.get('/', ensureAuthenticated, DashboardController.MainDashboard);

module.exports = router;