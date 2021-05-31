var _ = require("lodash");
var cModels = require("../../../models/system_admin/course");
var commonModels = require("../../../models/common");

class CourseService {
    constructor() {
      this.C_MODELS = cModels;
      this.COMMON_MODELS = commonModels;
    }

    async GetAllDepartmentAndCourseDurationService() {
      try {
        let deptData = [];
        let courseDurData = [];
        let allCourseList = [];
        let deptArr = [];
        let courseArr = [];
        const deptList = await this.COMMON_MODELS.GetAllDepartmentListModel();
        const courseDurList = await this.COMMON_MODELS.GetAllCourseDurationListModel();
        const allCourses = await this.GetAllCoursesForAdminPanelService();

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
              allCourseList.push({
                course_id: v.course_id,
                course_type: v.course_type,
                course_type_text: v.course_type == 1 ? 'Short' : 'Long',
                department_id: v.department_id,
                department_name: deptArr[v.department_id] != undefined ? deptArr[v.department_id] : v.department_id,
                sequence: v.sequence,
                course_title: v.course_title,
                short_title: v.short_title,
                course_duration_id: v.course_duration_id,
                course_duration_text: courseArr[v.course_duration_id] != undefined ? courseArr[v.course_duration_id] : v.course_duration_id,
                status: v.status,
                status_text: v.status == 1 ? 'Active' : 'Inactive',
              });
            });
          }
          
          return {
            status: true,
            deptList: deptData,
            courseDurList: courseDurData,
            allCourseList: allCourseList,
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

    async GetAllCoursesForAdminPanelService() {
      try {
        const courseAdmin = await this.C_MODELS.GetAllCoursesForAdminPanelModel();
        if(courseAdmin.status) {
          return {
            status: true,
            result: courseAdmin.result,
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
    
    async SaveCourseService(data) {
      try {
        const saveCourse = await this.C_MODELS.SaveCourseModel(data);
      } catch(err) {
        console.log(err);
        return {
          status: false,
          err: err
        }
      }
    }
    
}

module.exports = CourseService;