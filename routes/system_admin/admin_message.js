var express = require('express');
var router = express.Router();
const { forwardAuthenticated, ensureAuthenticated } = require("../../config/auth");
const AdminMessageController = require('../../controllers/system_admin/AdminMessageController');

// message
router.get('/', ensureAuthenticated, AdminMessageController.MessageAllView);
// router.post('/create-new-user', ensureAuthenticated, AdminMessageController.CreateNewSystemUser);


module.exports = router;