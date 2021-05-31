var moment = require('moment');
// const NoticeService = require( "../services/Course/NoticeService");

var self = (module.exports = {
	NoticeView: async function (req, res, next) {
		try {
			// const NoticeServiceIns = new NoticeService();
			// var courseList = await NoticeServiceIns.GetCourseListService();

			let data = {
				title: 'Notice',
				moment: moment
			};
			res.render('front_view/notice', data);
			// res.render('err_404', data);
		} catch (err) {
			console.log(err);
			res.status(500).json(err);
		}
	},

});