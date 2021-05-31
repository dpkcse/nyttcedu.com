var _ = require("lodash");
var moment = require('moment');
const AdmissionService = require( "../../services/SystemAdmin/Admission/AdmissionService");
const CommonService = require("../../services/Common/CommonService");

var self = (module.exports = {
	AsignCourseGet : async function (req, res, next) {
		try {
			const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			
			const AsignIns = new AdmissionService();
			var studentAndCourseList = await AsignIns.GetAllStudentAndCourseService();
      // console.log("studentAndCourseList.allCourseList", studentAndCourseList)
			let data = {
				title : 'Admin | Asign Course',
				menu : 'Admission',
				sub_menu: 'Asign Course',
				route: '/add-system/asign-course',
        moment: moment,
        _:_,
        user_info: user_info,
				course_list: studentAndCourseList.allCourseList,
				courseDurList: studentAndCourseList.courseDurList,
				
      };
      // console.log("===================== | ===========================");
			res.render('system_admin/asign_course', data);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},
});