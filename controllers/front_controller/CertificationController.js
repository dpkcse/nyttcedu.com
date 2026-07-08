var moment = require('moment');
const CertificationService = require( "../../services/Certification/CertificationService");

var self = (module.exports = {
	CertLanding : async function (req, res, next) {
		try {
			let data = {
				title : 'Search Result',
				moment: moment
			};
			res.render('front_view/certification', data);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},


	VerifyCertificateBySerial : async function (req, res, next) {
		try {
			let serial_no = String(req.params.serial_no || '').trim();
			const CertificationIns = new CertificationService();
			var certificate = await CertificationIns.GetResultInfoBySerialService(serial_no);
			let data = {
				title : 'Certificate Verification',
				moment: moment,
				certificate: certificate.status ? certificate.result : null,
				errMsg: certificate.status ? '' : 'Certificate not found or not approved'
			};
			res.render('front_view/certificate_verify_result', data);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

	SearchCertificateInfo : async function (req, res, next) {
		try {
			let serial_no = req.body.serial_no.trim();
		const CertificationIns = new CertificationService();
		var certificate = await CertificationIns.GetResultInfoBySerialService(serial_no);

			if(certificate.status) {
				res.send(certificate);
			} else {
				res.send(certificate);
			}
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

});
