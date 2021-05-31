var _ = require("lodash");
var certification_models = require("../../models/certification");

class CertificationService {
    constructor() {
      this.CERT_MODELS = certification_models;
    }

    async GetResultInfoBySerialService(serial_no) {
      try {
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
                err: 'Unable To Tiew Result.'
              }
            }            
        } else {
          return {
            status: false,
            err: 'Result Not Found.'
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