var express = require('express');
var router = express.Router();
const { forwardAuthenticated, ensureAuthenticated } = require("../../config/auth");
const AdminUserController = require('../../controllers/system_admin/AdminUserController');

//admin-user
router.get('/', ensureAuthenticated, AdminUserController.CratedUserView);
router.post('/create-new-user', ensureAuthenticated, AdminUserController.CreateNewSystemUser);

router.get('/change-password', ensureAuthenticated, AdminUserController.ChangeUserPasswordGetView);
router.post('/change-password', ensureAuthenticated, AdminUserController.PostChangeUserPassword);






module.exports = router;