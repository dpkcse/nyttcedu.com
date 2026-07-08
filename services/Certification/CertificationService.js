var _ = require("lodash");
var certification_models = require("../../models/certification");

class CertificationService {
    constructor() {
      this.CERT_MODELS = certification_models;
    }

    async GetResultInfoBySerialService(serial_no) {
      try {
        serial_no = String(serial_no || '').trim();
        if(!/^[a-zA-Z0-9_-]{1,50}$/.test(serial_no)) {
          return {
            status: false,
            err: 'Certificate not found or not approved'
          }
        }
        const certInfo = await certification_models.GetResultInfoBySerialModel(serial_no);
        if(certInfo.status && certInfo.result.length == 1) {
            let data = {
              course_title: certInfo.result[0].course_title,
              f_name: certInfo.result[0].f_name,
              m_name: certInfo.result[0].m_name,
              s_name: certInfo.result[0].s_name,
              passing_year: certInfo.result[0].passing_year,
              result: certInfo.result[0].result,
              serial_no: certInfo.result[0].serial_no,
              session: certInfo.result[0].session,
              issue_date: certInfo.result[0].issue_date,
              is_approved: certInfo.result[0].is_approved
            }
            if(data.is_approved == '1') {
              return {
                status: true,
                result : data,
              }
            } else {
              return {
                status: false,
                err: 'Certificate not found or not approved'
              }
            }            
        } else {
          return {
            status: false,
            err: 'Certificate not found or not approved'
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

module.exports = CertificationService;