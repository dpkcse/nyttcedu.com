var express = require('express');
var router = express.Router();
const AdminForgetPasswordControllter = require('../../controllers/system_admin/AdminForgetPasswordControllter');

router.get('/', AdminForgetPasswordControllter.AdminPreparationResetPassView);
router.post('/', AdminForgetPasswordControllter.AdminPreparationPasswordReset);



module.exports = router;