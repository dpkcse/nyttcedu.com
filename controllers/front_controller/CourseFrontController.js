var moment = require('moment');
const _ = require("lodash");
const CourseFrontService = require( "../../services/CourseFront/CourseFrontService");
const course = require('../../models/system_admin/course');

var self = (module.exports = {
	GetCourseListController : async function (req, res, next) {
		try {
			let data = {
        title : 'Courses',
        moment: moment,
				_: _,
				shortDeptWiseCourseList: [],
				longDeptWiseCourseList: [],
			};
      const GetCourseIns = new CourseFrontService();
			var allCourse = await GetCourseIns.GetCourseListService();
			if(allCourse.status) {
				data.shortDeptWiseCourseList = allCourse.result.shortDeptWiseCourseList;
				data.longDeptWiseCourseList = allCourse.result.longDeptWiseCourseList;
				res.render('front_view/courses_front', data);
			} else {
				console.log(allCourse.err);
				res.render('front_view/err_404', data);
			}
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

  
});