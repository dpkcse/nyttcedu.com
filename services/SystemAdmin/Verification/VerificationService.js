var _ = require("lodash");
var moment = require("moment");
var vModels = require("../../../models/system_admin/VerificationModel");
var commonModels = require("../../../models/common");

class VerificationService {
    constructor() {
      this.V_MODELS = vModels;
      this.COMMON_MODELS = commonModels;
    }
    
    async GetVerifyNeededCertificatesService(user_type) {
      try {
        let _user_type = user_type;
        let verifyList = {};
        var empIdName = {}; // Associative array as object
        if(_user_type == 1 || _user_type == 2) {
          const empList = await this.COMMON_MODELS.GetAllEmployeeListModel();
          const verifyableCert = await this.V_MODELS.GetVerifyNeededCertificatesModel();
          // console.log()
          if(empList.status) {
            if(empList.result.length > 0) {
              _.each(empList.result, function(v, k) {
                let emp_id = parseInt(v.employee_id);
                empIdName[emp_id] = v.emp_name;
              });
            }
          }

          if(verifyableCert.status && verifyableCert.result.length > 0) {
            _.each(verifyableCert.result, function(v, k) {
              if(!(v.created_by in verifyList)) {
                verifyList[v.created_by] = {
                  created_by: empIdName[v.created_by],
                  data: []
                };
              }
              verifyList[v.created_by].data.push({
                  id        : v.id,
                  serial_no : v.serial_no,
                  s_name    : v.s_name,
                  f_name    : v.f_name,
                  m_name    : v.m_name,
                  session   : v.session,
                  course_title: v.course_title,
                  passing_year: v.passing_year,
                  result      : v.result,
                  created_at  : moment(v.created_at).format('L'),
                });
            });
            // console.log("verifyList", verifyList[1].data)   
                         
            return {
              status: true,
              result: verifyList
            }    
          } else {
            return {
              status: true,
              result: []
            }
          }
        } else {
          return {
            status: false,
            err: 'User not Admin Or Super Admin'
          }
        }
      } catch(err) {
        console.log(err);
      }
    }

    async VerifyCertificateService(id) {
      try {
        const verified = await this.V_MODELS.VerifyCertificateModel(id);
        if(verified.status && verified.result.affectedRows == 1) {
          return {
            status: true,
            sucMsg: 'A certificate verified successfully'
          }
        } else {
          return {
            status: true,
            errcMsg: 'Unable to verify'
          }
        }
      } catch(err) {
        console.log("80", err);
        return {
          status: true,
          errcMsg: 'Unable to verify'
        }
      }
    }
    
    async DeleteCertificateService(id) {
      try {
        const deleted = await this.V_MODELS.DeleteCertificateModel(id);
        if(deleted.status && deleted.result.affectedRows == 1) {
          return {
            status: true,
            sucMsg: 'A certificate deleted successfully'
          }
        } else {
          return {
            status: true,
            errcMsg: 'Unable to delete'
          }
        }
      } catch(err) {
        console.log("80", err);
        return {
          status: true,
          errcMsg: 'Unable to delete'
        }
      }
    }
        
    async GetEditReqCertificatesService(user_type) {
      try {
        let _user_type = user_type;
        let verifyList = {};
        var empIdName = {}; // Associative array as object
        if(_user_type == 1 || _user_type == 2) {
          const empList = await this.COMMON_MODELS.GetAllEmployeeListModel();
          const editableCert = await this.V_MODELS.GetEditRequestCertificatesModel();
          // console.log()
          if(empList.status) {
            if(empList.result.length > 0) {
              _.each(empList.result, function(v, k) {
                let emp_id = parseInt(v.employee_id);
                empIdName[emp_id] = v.emp_name;
              });
            }
          }

          if(editableCert.status && editableCert.result.length > 0) {
            _.each(editableCert.result, function(v, k) {
              if(!(v.update_req_user_id in verifyList)) {
                verifyList[v.update_req_user_id] = {
                  update_req_user_id: empIdName[v.update_req_user_id],
                  data: []
                };
              }
              verifyList[v.update_req_user_id].data.push({
                  id        : v.id,
                  serial_no : v.serial_no,
                  s_name    : v.s_name,
                  f_name    : v.f_name,
                  m_name    : v.m_name,
                  session   : v.session,
                  course_title: v.course_title,
                  passing_year: v.passing_year,
                  result      : v.result,
                  created_at  : moment(v.created_at).format('L'),
                });
            });
            // console.log("verifyList", verifyList[1].data);
                         
            return {
              status: true,
              result: verifyList
            }    
          } else {
            return {
              status: true,
              result: []
            }
          }
        } else {
          return {
            status: false,
            err: 'User not Admin Or Super Admin'
          }
        }
      } catch(err) {
        console.log(err);
      }
    }
    
}

module.exports = VerificationService;