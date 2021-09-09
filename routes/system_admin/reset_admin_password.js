var express = require('express');
var router = express.Router();
const ResetPasswordControllter = require('../../controllers/system_admin/ResetPasswordControllter');

router.get('/', ResetPasswordControllter.ResetPassAdminReady);
router.post('/', ResetPasswordControllter.ResetPassAdminSet);

router.post('/reset-pass-menual-by-admin-only', ResetPasswordControllter.ResetPassByMenualAdminOnly);
// /reset-admin-password/reset-pass-menual-by-admin-only


module.exports = router;