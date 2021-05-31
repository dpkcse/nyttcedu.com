var express = require('express');
var router = express.Router();
const { forwardAuthenticated, ensureAuthenticated } = require("../../config/auth");
const AdminLoginController = require('../../controllers/system_admin/AdminLoginController');

//admin-login
router.get('/', AdminLoginController.AdminLoginForm);
router.post('/', AdminLoginController.CheckUserPasswordLogin);

router.get('/logout', ensureAuthenticated, AdminLoginController.LogoutUserAdmin);
router.get('/logout-live-home', ensureAuthenticated, AdminLoginController.LogoutGoLiveHomeUserAdmin);



module.exports = router;