var _ = require("lodash");
var common_models = require("../../models/common");

class DashboardService {
    constructor() {
      this.C_MODELS = common_models;
    }

    async GetAllDepartmentAndCourseDurationList() {
      try {        
        const courseDurList = await C_MODELS.GetAllCourseDurationList();
        const deptList = await C_MODELS.GetAllDepartmentList();
        if(deptList.status && courseDurList.status) {
            return {
              status: true,              
              courseDurList : courseDurList.result,
              deptList : deptList.result,
            }
        } else {
          return {
            status: false,
            err: 'Data Not Found.'
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

module.exports = DashboardService;