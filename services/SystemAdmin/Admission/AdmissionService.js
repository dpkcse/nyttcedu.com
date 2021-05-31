var _ = require("lodash");
var cModels = require("../../../models/system_admin/course");
var commonModels = require("../../../models/common");
var CourseService = require("../Course/CourseService");

class AdmissionService {
    constructor() {
      this.C_MODELS = cModels;
      this.COMMON_MODELS = commonModels;
    }

    async GetAllStudentAndCourseService() {
      try {
        let deptData = [];
        let courseDurData = [];
        let allCourseList = [];
        let deptArr = [];
        let courseArr = [];
        const deptList = await this.COMMON_MODELS.GetAllDepartmentListModel();
        const courseDurList = await this.COMMON_MODELS.GetAllCourseDurationListModel();
        const CourseIns = new CourseService();
        const allCourses = await CourseIns.GetAllCoursesForAdminPanelService();
        const allStudent = await this.COMMON_MODELS.GetAllStudentListModel();

        if(deptList.status && courseDurList.status) {
          if(deptList.result.length > 0) {
            _.each(deptList.result, function(v, k) {
              deptData.push({
                department_id: v.department_id,
                department_name: v.department_name,
              });
              deptArr[v.department_id] = v.department_name;
            });
          }
          if(courseDurList.result.length > 0) {
            _.each(courseDurList.result, function(v, k) {
              courseDurData.push({
                course_duration_id: v.course_duration_id,
                duration_title: v.duration_title,
              });
              courseArr[v.course_duration_id] = v.duration_title;
            });
          }

          if(allCourses.status && allCourses.result.length > 0) {
            _.each(allCourses.result, function(v, k) {
              if(v.status == 1) {
                allCourseList.push({
                  course_id: v.course_id,
                  course_type: v.course_type,
                  course_type_text: v.course_type == 1 ? 'Short' : 'Long',
                  // department_id: v.department_id,
                  department_name: deptArr[v.department_id] != undefined ? deptArr[v.department_id] : v.department_id,
                  course_title: v.course_title,
                  short_title: v.short_title,
                  // course_duration_id: v.course_duration_id,
                  course_duration_text: courseArr[v.course_duration_id] != undefined ? courseArr[v.course_duration_id] : v.course_duration_id,
                  // status: v.status,
                  // status_text: v.status == 1 ? 'Active' : 'Inactive',
                });
              }
            });
          }
          console.log("allCourseList = ", allCourseList)
          return {
            status: true,
            allCourseList: allCourseList,
            courseDurList: courseDurList.result,
          }
        } else {
          return {
            status: false,
            err: err
          }
        }
      } catch(err) {
        return {
          status: false,
          err: err
        }
      }
    }

    
}

module.exports = AdmissionService;