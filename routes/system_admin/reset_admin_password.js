var express = require('express');
var router = express.Router();
const ResetPasswordControllter = require('../../controllers/system_admin/ResetPasswordControllter');

router.get('/', ResetPasswordControllter.ResetPassAdminReady);
router.post('/', ResetPasswordControllter.ResetPassAdminSet);



module.exports = router;