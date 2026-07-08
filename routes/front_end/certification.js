var express = require('express');
var router = express.Router();
const CertificationController = require('../../controllers/front_controller/CertificationController');

router.get('/', CertificationController.CertLanding);
router.get('/verify/:serial_no', CertificationController.VerifyCertificateBySerial);
router.post('/', CertificationController.SearchCertificateInfo);

module.exports = router;