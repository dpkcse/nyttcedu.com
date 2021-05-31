var moment = require('moment');
// const CourseService = require( "../services/Course/CourseService");

var self = (module.exports = {
	AdmissionForm : async function (req, res, next) {
		try {
      // const CourseService = new CourseService();
      // var courseList = await CourseService.GetCourseListService();

			let data = {
        title : 'Admission',
        moment: moment
			};
			res.render('front_view/admission', data);
			// res.render('err_404', data);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

});