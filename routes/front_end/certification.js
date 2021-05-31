var express = require('express');
var router = express.Router();
const CertificationController = require('../../controllers/front_controller/CertificationController');

router.get('/', CertificationController.CertLanding);
router.post('/', CertificationController.SearchCertificateInfo);

module.exports = router;