var moment = require('moment');
// const MailusService = require( "../services/Course/MailusService");

var self = (module.exports = {
	Mailus: async function (req, res, next) {
		try {
			// const MailusServiceIns = new MailusService();
			// var courseList = await MailusServiceIns.GetCourseListService();

			let data = {
				title: 'Contact Us',
				moment: moment
			};
			// res.render('contact_us', data);
			res.render('front_view/err_404', data);
		} catch (err) {
			console.log(err);
			res.status(500).json(err);
		}
	},

});