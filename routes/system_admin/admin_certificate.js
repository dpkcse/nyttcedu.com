var express = require('express');
var router = express.Router();
const { forwardAuthenticated, ensureAuthenticated } = require("../../config/auth");
const AdminCertificateController = require('../../controllers/system_admin/AdminCertificateController');

//certificate
// router.get('/', ensureAuthenticated, AdminCertificateController.AddCertificateOldwayGetView);

router.get('/add-certificate-old-way', ensureAuthenticated, AdminCertificateController.AddCertificateOldwayGetView);
router.post('/add-certificate-old-way', ensureAuthenticated, AdminCertificateController.SaveCertificateOldWay);

router.get('/search-old-way', ensureAuthenticated, AdminCertificateController.SearchCertificateGet);
router.post('/search-old-way', ensureAuthenticated, AdminCertificateController.FoundCertificateView);

router.post('/edit-request', ensureAuthenticated, AdminCertificateController.CertificateEditRequest);
router.post('/cancel-edit-request', ensureAuthenticated, AdminCertificateController.CertCancelEditRequest);
router.post('/allow-edit-request', ensureAuthenticated, AdminCertificateController.AllowEditRequest);
router.post('/allow-edit-request-check-for-current-user', ensureAuthenticated, AdminCertificateController.IsAllowEditReqForCurrentUser);

router.get('/update-certificate-old-way/:id', ensureAuthenticated, AdminCertificateController.UpdateCertOldWayGet);
router.post('/update-certificate-old-way', ensureAuthenticated, AdminCertificateController.UpdateCertOldWayPost);


// router.post('/', ensureAuthenticated, AdminCertificateController.CertificateRearrange);

module.exports = router;