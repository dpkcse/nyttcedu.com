var _ = require("lodash");
var moment = require("moment");
var vModels = require("../../../models/system_admin/VerificationModel");
var commonModels = require("../../../models/common");

class VerificationService {
    constructor() {
      this.V_MODELS = vModels;
      this.COMMON_MODELS = commonModels;
    }
    
    async GetAllNotRepliedMessagesService() {
      try {
        let messageList = [];
        const msgall = await this.V_MODELS.GetAllNotRepliedMessagesModel();

        if(msgall.status && msgall.result.length > 0) {
          _.each(msgall.result, function(v, k) {
            messageList.push({
              id        : v.id,
              date_time : moment(v.date_time).format('L'),
              name      : v.name,
              mobile    : v.mobile,
              email     : v.email,
              subject   : v.subject,
              message   : v.message,
              status   : v.status,
            });
          });
        }
        // console.log("messageList", messageList)
        return {
          status: true,
          result: messageList
        }    
      //   let _user_type = user_type;
      //   let verifyList = {};
      //   var empIdName = {}; // Associative array as object
      //   if(_user_type == 1 || _user_type == 2) {
      //     const empList = await this.COMMON_MODELS.GetAllEmployeeListModel();
      //     const verifyableCert = await this.V_MODELS.GetVerifyNeededCertificatesModel();
      //     // console.log()
          // if(empList.status) {
          //   if(empList.result.length > 0) {
          //     _.each(empList.result, function(v, k) {
          //       let emp_id = parseInt(v.employee_id);
          //       empIdName[emp_id] = v.emp_name;
          //     });
          //   }
          // }

      //     if(verifyableCert.status && verifyableCert.result.length > 0) {
      //       _.each(verifyableCert.result, function(v, k) {
      //         if(!(v.created_by in verifyList)) {
      //           verifyList[v.created_by] = {
      //             created_by: empIdName[v.created_by],
      //             data: []
      //           };
      //         }
      //         verifyList[v.created_by].data.push({
      //             id        : v.id,
      //             serial_no : v.serial_no,
      //             s_name    : v.s_name,
      //             f_name    : v.f_name,
      //             m_name    : v.m_name,
      //             session   : v.session,
      //             course_title: v.course_title,
      //             passing_year: v.passing_year,
      //             result      : v.result,
      //             created_at  : moment(v.created_at).format('L'),
      //           });
      //       });
      //       // console.log("verifyList", verifyList[1].data)   
                         
      //       return {
      //         status: true,
      //         result: verifyList
      //       }    
      //     } else {
      //       return {
      //         status: true,
      //         result: []
      //       }
      //     }
      //   } else {
      //     return {
      //       status: false,
      //       err: 'User not Admin Or Super Admin'
      //     }
      //   }
      } catch(err) {
        console.log(err);
      }
    }

    // async VerifyCertificateService(id) {
    //   try {
    //     const verified = await this.V_MODELS.VerifyCertificateModel(id);
    //     if(verified.status && verified.result.affectedRows == 1) {
    //       return {
    //         status: true,
    //         sucMsg: 'A certificate verified successfully'
    //       }
    //     } else {
    //       return {
    //         status: true,
    //         errcMsg: 'Unable to verify'
    //       }
    //     }
    //   } catch(err) {
    //     console.log("80", err);
    //     return {
    //       status: true,
    //       errcMsg: 'Unable to verify'
    //     }
    //   }
    // }
        
}

module.exports = VerificationService;