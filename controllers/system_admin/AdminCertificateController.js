var _ = require("lodash");
var moment = require('moment');
const AdminCertificateService = require( "../../services/SystemAdmin/Certificate/AdminCertificateService");
const CommonService = require("../../services/Common/CommonService");
var self = (module.exports = {
	AddCertificateOldwayGetView : async function (req, res, next) {
		try {
			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			const AddCerIns = new AdminCertificateService();
			var someOldCertificates = await AddCerIns.GetSomeOldCertificateService();
      // console.log("someOldCertificates", someOldCertificates)
			let data = {
				title : 'Admin | Add New Old Way',
				menu : 'Certificates',
				sub_menu: 'Add New Old Way',
				route: '/certificate/add-certificate-old-way',
				moment: moment,
				_:_,
				user_info: user_info,
				old_certificates: someOldCertificates.result,
				sucMsg: req.flash('sucMsg'),
				errMsg: req.flash('errMsg')
			};
			res.render('system_admin/certificate/add_certificate_old_way', data);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

	SaveCertificateOldWay : async function (req, res, next) {
		try {
			let postData = {
				s_name: req.body.name.trim(),
				f_name: req.body.fathers_name.trim(),
				m_name: req.body.mothers_name.trim(),
				serial_no: req.body.serial_no.trim(),
				session: req.body.session.trim(),
				course_title: req.body.course_title.trim(),
				passing_year: req.body.passing_year.trim(),
				result: req.body.result.trim(),
				created_by: req.user.user_id,
			};
			// console.log("postData = ", postData)
			const SaveCerIns = new AdminCertificateService();
			var saveOldCert = await SaveCerIns.SaveOldWayCertificateService(postData);
			if(saveOldCert.status) {
				// errors.push("Unable to update");
				req.flash("sucMsg", saveOldCert.sucMsg);
			} else {
				req.flash("errMsg", saveOldCert.errMsg);
			}
			res.redirect('/certificate/add-certificate-old-way');
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

	SearchCertificateGet : async function (req, res, next) {
		try {
			// const SaveCerIns = new AdminCertificateService();
			// var saveOldCert = await SaveCerIns.SaveOldWayCertificateService(postData);
			// if(saveOldCert.status) {
			// 	// errors.push("Unable to update");
			// 	req.flash("sucMsg", saveOldCert.sucMsg);
			// } else {
			// 	req.flash("errMsg", saveOldCert.errMsg);
			// }

			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			let data = {
				title : 'Admin | Search Old Way',
				menu : 'Certificates',
				sub_menu: 'Search Old Way',
				route: '/certificate/search-old-way',
				moment: moment,
				_:_,
				user_info: user_info,
				sucMsg: req.flash('sucMsg'),
				errMsg: req.flash('errMsg')
			};
			res.render('system_admin/certificate/certificate_search_old_way', data);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

	FoundCertificateView : async function(req, res, next) {
		try {
			let data = {
				s_name : req.body.s_name.trim(),
				serial_no : req.body.serial_no.trim(),
			}
			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			let user_id = user_info.user_id;
			const FindIns = new AdminCertificateService();
			var findCerts = await FindIns.FindCertificateService(data, user_id);
			if(findCerts.status) {
				res.json(findCerts);
			} else {
				res.json(findCerts);
			}
		} catch(err) {
			console.log(err);
			res.json(err);
		}
	},

	CertificateEditRequest : async function(req, res, next) {
		try {
			let certificate_id = req.body.id;
			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			// console.log(user_info.user_id)
			const EditReqIns = new AdminCertificateService();
			var editAllow = await EditReqIns.CertificateEditRequestService(certificate_id, user_info.user_id);
			if(editAllow.status) {
				res.json(editAllow);
			} else {
				res.json(editAllow);
			}
		} catch(err) {
			console.log(err);
			res.json(err);
		}
	},

	UpdateCertOldWayGet : async function(req, res, next) {
		try {
			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			let data = {
				title : 'Admin | Add New Old Way',
				menu : 'Certificates',
				sub_menu: 'Update old way',
				route: '/certificate/update-certificate-old-way',
				moment: moment,
				_:_,
				user_info: user_info,
				old_certificates: {},
				update_cert_info: {},
				sucMsg: req.flash('sucMsg'),
				errMsg: req.flash('errMsg')
			};

			let certificate_id =  parseInt(req.params.id.trim());
			// if(Number.isInteger(certificate_id)) {
				const SingleCerIns = new AdminCertificateService();
				var oldCert = await SingleCerIns.GetoldCertInfoByIdService(user_info.user_id, certificate_id);
				// console.log("oldCert = ", oldCert)
				if(oldCert.status) {
					//jodi user admin ba super admin hoy tahole edit korte parbe
					if(user_info.user_type == '1' || user_info.user_type == '2') {
						data.old_certificates = oldCert.result;
						console.log("data.old_certificates = ", data.old_certificates)
						res.render('system_admin/certificate/update_certificate_old_way', data);
					} else {
						//Check update permisson is exist or not loged In user
						const PermChkIns = new AdminCertificateService();
						var hasUpdatePerm = await PermChkIns.CheckCertUpdatePermissionService(certificate_id, user_info.user_id);
						if(hasUpdatePerm.status) {
							data.old_certificates = oldCert.result;
							res.render('system_admin/certificate/update_certificate_old_way', data);
						} else {
							req.flash('errMsg', 'You have no update permission this data! 1');
							res.redirect('/certificate/search-old-way');
						}
					}
				} else {
					req.flash('errMsg', 'You have no update permission this data! 2');
					res.redirect('/certificate/search-old-way');
				}
			// } else {
			// 	req.flash('errMsg', 'Providing wrong certificate information!');
			// 	res.redirect('/certificate/search-old-way');
			// }
		} catch(err) {
			console.log(err);
			res.json(err);
		}
	},

	UpdateCertOldWayPost : async function(req, res, next) {
		try {
			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			let data = {
				title : 'Admin | Update Old Way',
				menu : 'Certificates',
				sub_menu: 'Update old way',
				route: '/certificate/update-certificate-old-way',
				moment: moment,
				_:_,
				user_info: user_info,
				old_certificates: {},
				update_cert_info: {},
				sucMsg: '',
				errMsg: ''
			};

			let update_data = {
				id							: req.body.id.trim(),
				serial_no				: req.body.serial_no.trim(),
				s_name					: req.body.name.trim(),
				f_name					: req.body.fathers_name.trim(),
				m_name					: req.body.mothers_name.trim(),
				session					: req.body.session.trim(),
				course_title		: req.body.course_title.trim(),
				passing_year		: req.body.passing_year.trim(),
				result					: req.body.result.trim(),
				// is_insert_or_update : 2,
				updated_by			: user_info.user_id,
				updated_at			: moment().format("YYYY-MM-DD HH:mm:ss"),
				// update_req_user_id: null,
				update_request : 0
			};
			let serial_no	= req.body.serial_no.trim();
			let id				= req.body.id.trim();
			// console.log('update_data', update_data)
			const AcertUpdateIns = new AdminCertificateService();
			var isUpdateCert = await AcertUpdateIns.CertUpdateByIdService(update_data);
			// console.log('update_data', update_data)
			if(isUpdateCert.status) {
				//at a time have only a edit request stay
				var updateBackupStatus = await AcertUpdateIns.updateBackupCertificateStatus(id, serial_no);
				req.flash("sucMsg", 'Certificate information updated successfully.');
				data.update_cert_info = update_data;
				data.sucMsg = req.flash("sucMsg");
				res.render('system_admin/certificate/update_certificate_old_way', data);
			} else {
				req.flash("errMsg", 'Certificate information not updated!');
				data.errMsg = req.flash("errMsg");
				// redirect korte hoibe
				res.render('system_admin/certificate/update_certificate_old_way', data);
			}
		} catch(err) {
			console.log(err);
			res.json(err);
		}
	},

	CertCancelEditRequest : async function(req, res, next) {
		try {
			let certificate_id = req.body.id;
			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			// console.log(user_info.user_id)
			// res.json({status: true, sucMsg: "hello2222222"});
			const EditReqCancelIns = new AdminCertificateService();
			var editReqCancel = await EditReqCancelIns.CertEditReqCancelService(certificate_id, user_info.user_id);
			if(editReqCancel.status) {
				res.json(editReqCancel);
			} else {
				res.json(editReqCancel);
			}
		} catch(err) {
			console.log(err);
			res.json(err);
		}
	},

	AllowEditRequest : async function(req, res, next) {
		try {
			let certificate_id = req.body.id;
			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			console.log(certificate_id)
			const AllowEditReqIns = new AdminCertificateService();
			var allow = await AllowEditReqIns.AllowEditReqService(certificate_id, user_info.user_id);
			if(allow.status) {
				res.json(allow);
			} else {
				res.json(allow);
			}
		} catch(err) {
			console.log(err);
			res.json(err);
		}
	},

	IsAllowEditReqForCurrentUser : async function(req, res, next) {
		try {
			let certificate_id = req.body.id;
			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			console.log(certificate_id)
			const CheckEditReqIns = new AdminCertificateService();
			var checkReq = await CheckEditReqIns.IsAllowEditReqForCurrentUserService(certificate_id, user_info.user_id);
			if(checkReq.status) {
				res.json(checkReq);
			} else {
				res.json(checkReq);
			}
		} catch(err) {
			console.log(err);
			res.json(err);
		}
	},


	GenerateCertificatePdf : async function(req, res, next) {
		try {
			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			const GenerateIns = new AdminCertificateService();
			const generated = await GenerateIns.GenerateCertificatePdfService(req.body.id, user_info.user_id);
			res.json(generated);
		} catch(err) {
			console.log(err);
			res.json({ status: false, errMsg: 'Unable to generate certificate PDF.' });
		}
	},

	// CertificateRearrange : async function (req, res, next) {
	// 	let name = req.body.name;
	// 	console.log(name, " = ============================================================");
	// 	const ArrangeIns = new AdminCertificateService();
	// 	var reArrange = await ArrangeIns.CertificateRearrangeService();
	// 	res.redirect('/certificate/add-certificate-old-way');
	// },
});
