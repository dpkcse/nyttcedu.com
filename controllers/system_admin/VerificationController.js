var moment = require("moment");
var _ = require("lodash")
const VerificationService = require("../../services/SystemAdmin/Verification/VerificationService");
const CommonService = require("../../services/Common/CommonService");

var self = (module.exports = {
  VerificationCertificateGetView: async function (req, res, next) {
    try {
      const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);

      const VerificIns = new VerificationService();
      var verifyCertList = await VerificIns.GetVerifyNeededCertificatesService(user_info.user_type);
      
      let data = {
        title: "Admin | Verify Request",
        menu: "Verify Request",
        sub_menu: "Certificate Verification",
        route: "/verification/certificate",
        moment: moment,
        _ : _,
        user_info: user_info,
        verifyCertList: verifyCertList.result,
      };
      res.render("system_admin/verification/certificate_verification", data);
    } catch (err) {
      console.log(err);
      const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
      let data = {
        title: "Admin | Verify Request",
        menu: "Verify Request",
        sub_menu: "Certificate Verification",
        route: "/verification/certificate",
        moment: moment,
        _ : _,
        user_info: user_info,
      };
      res.render("system_admin/admin_err_404", data);
    }
  },

  VerifyCertificate: async function (req, res, next) {
    try {
      let id = req.body.id.trim();
      // console.log(id);
      const VfIns = new VerificationService();
      var verified = await VfIns.VerifyCertificateService(id);
      res.status(200).json(verified)
    } catch (err) {
      console.log("47", err);
      res.status( 200 ).json({
        status: true,
        errcMsg: 'Unable to verify'
      });
    }
  },
  
  DeleteCertificate: async function (req, res, next) {
    try {
      let id = req.body.id;
      // console.log(id);
      const VfIns = new VerificationService();
      var deleteCert = await VfIns.DeleteCertificateService(id);
      res.status(200).json(deleteCert)
    } catch (err) {
      console.log("67", err);
      res.status( 200 ).json({
        status: true,
        errcMsg: 'Unable to Delete'
      });
    }
  },

  CertificateEditAllow: async function (req, res, next) {
    try {
      const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
      const editCertIns = new VerificationService();
      var allowCertList = await editCertIns.GetEditReqCertificatesService(user_info.user_type);

      let data = {
        title: "Admin | Verify Request",
        menu: "Verify Request",
        sub_menu: "Certificate Edit Request",
        route: "/verification/cert-edit-request",
        moment: moment,
        _ : _,
        user_info: user_info,
        allowCertList: allowCertList.result,
      };
      res.render("system_admin/verification/certificate_edit_request", data);
    } catch (err) {
      console.log("91", err);
    }
  },

});
