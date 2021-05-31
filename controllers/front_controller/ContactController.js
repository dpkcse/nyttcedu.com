var moment = require('moment');
const ContactService = require( "../../services/Contact/ContactService");

var self = (module.exports = {
	ContactView : async function (req, res, next) {
		try {
			let data = {
        title : 'Contact Us',
				moment: moment,
				sugMsg: req.flash('sucMsg') ? req.flash('sucMsg') : '',
				errMsg: req.flash('errMsg') ? req.flash('errMsg') : '',
			};
			// console.log("flash", req.flash('sucMsg'))
			res.render('front_view/contact_us', data);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},
	SendMessage : async function (req, res, next) {
		try {
			let data = {
				name: req.body.name.trim(),
				mobile: req.body.mobile.trim(),
				email: req.body.email.trim(),
				subject: req.body.subject.trim(),
				message: req.body.message.trim(),
			};
			
      const ContactIns = new ContactService();
      var sendSaveMsg = await ContactIns.SaveAndSendMsgService(data);
			if(sendSaveMsg.status) {
				req.flash('success_msg', sendSaveMsg.sucMsg);
				// console.log("flash", req.flash('sucMsg'))
			} else {
				req.flash('error_msg', sendSaveMsg.errMsg);
			}
			res.redirect('/contact');
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},
	SubscribeEmail : async function (req, res, next) {
		try {
			let email = req.body.email;

			const SubscribeIns = new ContactService();
			var subsEmail = await SubscribeIns.SubscribeEmailService(email);
			// console.log(subsEmail)
			res.json(subsEmail);			
		} catch(err) {
			console.log(err)
			res.status(500).json(err);
		}
	},
});