var _ = require("lodash");
const CourseService = require( "../SystemAdmin/Course/CourseService");
var commonModel = require("../../models/common");


class CourseFrontService {
    constructor() {
      this.COMMON_MODELS = commonModel;
    }

    async GetCourseListService() {
      try {
        const courseIns = new CourseService();

        let deptArr = [];
        let courseArr = [];
        let shortDeptWiseCourseList = {};
        let longDeptWiseCourseList = {};
        
        const deptList = await this.COMMON_MODELS.GetAllDepartmentListModel();
        const courseDurList = await this.COMMON_MODELS.GetAllCourseDurationListModel();
        const allCourses = await courseIns.GetAllCoursesForAdminPanelService();

        if(deptList.status && courseDurList.status) {
          if(deptList.result.length > 0) {
            _.each(deptList.result, function(v, k) {
              deptArr[v.department_id] = v.department_name;
            });
          }
          if(courseDurList.result.length > 0) {
            _.each(courseDurList.result, function(v, k) {
              courseArr[v.course_duration_id] = v.duration_title;
            });
          }

          
          if(allCourses.status && allCourses.result.length > 0) {
            _.each(allCourses.result, function(v, k) {
              let cur_dept_name = deptArr[v.department_id] != undefined ? deptArr[v.department_id] : v.department_id;
              let cur_course_duration = courseArr[v.course_duration_id] != undefined ? courseArr[v.course_duration_id] : v.course_duration_id;
                  
              if(v.course_type == 1) { //short Course                 
                if(shortDeptWiseCourseList[deptArr[v.department_id]] == undefined) {
                  shortDeptWiseCourseList[cur_dept_name] = [];
                } 
                shortDeptWiseCourseList[cur_dept_name].push({
                  // course_id: v.course_id,
                  // course_type: v.course_type,
                  // course_type_text: v.course_type == 1 ? 'Short' : 'Long',
                  // department_id: v.department_id,
                  // department_name: cur_dept_name,
                  course_title: v.course_title,
                  short_title: v.short_title,
                  course_duration_text: cur_course_duration,
                });
              } else if(v.course_type == 2) { //Long Course                 
                if(longDeptWiseCourseList[deptArr[v.department_id]] == undefined) {
                  longDeptWiseCourseList[cur_dept_name] = [];
                } 
                longDeptWiseCourseList[cur_dept_name].push({
                  // course_id: v.course_id,
                  // course_type: v.course_type,
                  // course_type_text: v.course_type == 1 ? 'Short' : 'Long',
                  // department_id: v.department_id,
                  // department_name: cur_dept_name,
                  course_title: v.course_title,
                  short_title: v.short_title,
                  course_duration_text: cur_course_duration,
                });
              } else {
                console.log("Course Type Not Matching");
              }
            });
          }

          return {
            status: true,
            result: {
              shortDeptWiseCourseList: shortDeptWiseCourseList,
              longDeptWiseCourseList: longDeptWiseCourseList,
            }
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

module.exports = CourseFrontService;