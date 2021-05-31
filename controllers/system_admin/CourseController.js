var moment = require('moment');
var _ = require("lodash");
const CourseService = require( "../../services/SystemAdmin/Course/CourseService");
const CommonService = require("../../services/Common/CommonService");

var self = (module.exports = {
	CourseGet : async function (req, res, next) {
		try {
			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			
			const DeptCourseIns = new CourseService();
			var dept_courseDur = await DeptCourseIns.GetAllDepartmentAndCourseDurationService();
			let data = {
				_: _,
				title : 'Add Course | Dashboard',
				menu : 'Courses',
				sub_menu: 'Add Courses',
				route: '/add-course',
				moment: moment,
				user_info: user_info,
				course_duration : [],
				department : [],
				allCourseList: [],
			};
			if(dept_courseDur.status) {
				data.course_duration 	= dept_courseDur.courseDurList;
				data.department			= dept_courseDur.deptList;
				data.allCourseList		= dept_courseDur.allCourseList;
				res.render('system_admin/course/add_course', data);
			} else {
				res.render('system_admin/course/add_course', data);
			}
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},
	SaveNewCourseInfo : async function (req, res, next) {
		try {
			let data = {
				course_title 				: req.body.course_title.trim(),
				short_title 				: req.body.short_title.trim(),
				course_type 				: req.body.course_type.trim(),
				course_duration_id 	: req.body.course_duration_id.trim(),
				department_id 			: req.body.department_id.trim(),
				created_by					: req.user.user_id
			};
			const SaveCourseIns = new CourseService();
			var saveCourse = await SaveCourseIns.SaveCourseService(data);
			// console.log("data", data);
			
			res.redirect('/course');
		} catch(err) {
			console.log(err);
			res.status( 500 ).json(err);
		}
	},
});



	