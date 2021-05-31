var express = require('express');
var router = express.Router();
const { forwardAuthenticated, ensureAuthenticated } = require("../../config/auth");
const VerificationController = require('../../controllers/system_admin/VerificationController');


router.get('/certificate', ensureAuthenticated, VerificationController.VerificationCertificateGetView);
router.post('/verify-certificate', ensureAuthenticated, VerificationController.VerifyCertificate);

router.post('/delete-certificate', ensureAuthenticated, VerificationController.DeleteCertificate);

router.get('/cert-edit-request', ensureAuthenticated, VerificationController.CertificateEditAllow);

module.exports = router;