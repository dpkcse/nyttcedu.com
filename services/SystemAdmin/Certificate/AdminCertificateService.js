var _ = require("lodash");
var moment = require('moment');
var adminCertiModels = require("../../../models/system_admin/admin_certificate");
var commonModels = require("../../../models/common");
const { result } = require("lodash");

class AdminCertificateService {
    constructor() {
      this.AC_MODELS = adminCertiModels;
      this.COMMON_MODELS = commonModels;
    }

    async GetSomeOldCertificateService() {
      try {
        const oldCertificates = await this.AC_MODELS.GetSomeOldCerticatesModel();
        if(oldCertificates.status && oldCertificates.result.length > 0) {
					return {
						status: true,
						result: oldCertificates.result
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

    async SaveOldWayCertificateService(postData) {
      try {
        const oldWayCert = await this.AC_MODELS.SaveOldWayCertificateModel(postData);
        if(oldWayCert.status && oldWayCert.result.affectedRows == 1) {
					return {
						status: true,
						sucMsg: 'A old way certificate info saved successfully'
					}
        } else {
					return {
						status: false,
						errMsg: 'Certificate info not saved'
					}
        }
      } catch(err) {
        return {
          status: false,
          errMsg: err
        }
      }
    }

    async FindCertificateService(data) {
      try {
        let s_name = data.s_name;
				let serial_no = data.serial_no;
        let certificates = [];
        if(s_name || serial_no) {
          const foundCert = await this.AC_MODELS.FoundCertificateModel(data);
          if(foundCert.status && foundCert.result.length > 0) {
            _.each(foundCert.result, (v, k) => {
              certificates.push({
                id: v.id,
                serial_no: v.serial_no,
                s_name: v.s_name,
                f_name: v.f_name,
                m_name: v.m_name,
                session: v.session,
                course_title: v.course_title,
                passing_year: v.passing_year,
                result: v.result,
                is_insert_or_update: v.is_insert_or_update == 0 ? 'No' : 'Yes '+ v.is_insert_or_update + ' Update',
                is_approved: v.is_approved == 1 ? 'Yes' :'No',
                is_print: v.is_print == 1 ? 'Yes' :'No',
                is_received: v.is_received == 1 ? 'Yes' :'No',
                received_date: v.received_date == null ? 'No' :moment(v.received_date).format('L'),
                update_request: v.update_request,
                update_btn_is_enable: v.update_request == 1 ? 'disabled' : '',
              });
            });
            // console.log('ss', certificates)
            return {
              status: true,
              result: certificates,
              sucMsg: 'Find Certificates are showing below'
            }
          } else {
            return {
              status: false,
              errMsg: 'Certificate info not found'
            }
          }
        } else {
          return{
            status: false,
            errMsg: 'Student Name or Serial can not be empty'
          }
        }
      } catch(err) {
        console.log(err)
        return{
          status: false,
          errMsg: err
        }
      }
    }

    async CertificateEditRequestService(certificate_id, user_id) {
      try {
        if(certificate_id) {
          const isEditReqExist = await this.AC_MODELS.IsCertEditReqExistModel(certificate_id);
          if(isEditReqExist.status && isEditReqExist.result.length == 1) {
            if(isEditReqExist.result[0].update_request == 1) {
              return{
                status: false,
                errMsg: 'Already have a pending update request'
              }
            } else {
              const editReq = await this.AC_MODELS.CertificateEditRequestModel(certificate_id, user_id);
              if(editReq.status && editReq.result.affectedRows == 1) {
                return {
                  status: true,
                  sucMsg: 'Certificate Edit Request Successfully Send To Admin'
                }
              } else {
                return {
                  status: false,
                  errMsg: 'Unable to request edit certificate 1'
                }
              }
            }            
          } else {
            return{
              status: false,
              errMsg: 'Unable to request edit certificate 2'
            }
          }          
        } else {
          return{
            status: false,
            errMsg: 'Unable to request edit certificate 3'
          }
        }
      } catch(err) {
        console.log(err)
        return{
          status: false,
          errMsg: err
        }
      }
    }

    async GetoldCertInfoByIdService(certificate_id) {
      try {
        var singleCertInfo = await this.AC_MODELS.GetoldCertInfoByIdModel(certificate_id);
        // console.log("singleCertInfo", singleCertInfo.result)
        if(singleCertInfo.status && singleCertInfo.result.length == 1) {
          return {
            status: true,
            result: singleCertInfo.result[0]
          }
        } else {
          return {
            status: false,
            result: []
          }
        }
      } catch(err) {
        return {
          status: false,
          err: err
        }
      }
    }

    async CertUpdateByIdService(update_data) {
      try {
        let _update_data = update_data;        
        let serial_no = update_data.serial_no;
        let id = update_data.id;
        delete _update_data.id;
        delete _update_data.serial_no;
        var oneCertUpdate = await this.AC_MODELS.CertUpdateByIdModel(_update_data, id);
        // console.log("_update_data", _update_data);
        // console.log("id", id);
        if(oneCertUpdate.status && oneCertUpdate.result.affectedRows == 1) {
          return {
            status: true,
          }
        } else {
          return {
            status: false,
          }
        }
      } catch(err) {
        return {
          status: false,
          err: err
        }
      }
    }

    async CheckCertUpdatePermissionService(certificate_id, user_id) {
      try {
        var hasPerm = await this.AC_MODELS.CheckCertUpdatePermissionModel(certificate_id, user_id);
        // console.log('hasPerm', hasPerm)
        if(hasPerm.status && hasPerm.result.length == 1) {
          return {
            status: true,
          }
        } else {
          return {
            status: false,
          }
        }
      } catch(err) {
        return {
          status: false,
          err: err
        }
      }
    }
    
    async CertificateRearrangeService () {      
      const reArrange = await this.AC_MODELS.CertificateRearrangeModel();
    }
}

module.exports = AdminCertificateService;