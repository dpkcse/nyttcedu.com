var _ = require("lodash");
const admin_certificate = {};

admin_certificate.GetSomeOldCerticatesModel = async function GetSomeOldCerticatesModel(){
  return new Promise((resolve,reject)=>{
    // db.query('SELECT * FROM old_bttc_certificates ORDER BY SerialNO DESC LIMIT 50', function(error, result, fields) {            
    db.query('SELECT * FROM new_old_nyttc_certificates ORDER BY id DESC LIMIT 50', function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("certificate result", result);
        resolve({ status: true, result: result});
      }
    });
  });
}

admin_certificate.SaveOldWayCertificateModel = async function SaveOldWayCertificateModel(postData) {
  return new Promise((resolve,reject)=>{
    //ager data silo 2445 ta primary key er
    db.query('INSERT INTO new_old_nyttc_certificates SET ?', [postData], function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("certificate save", result);
        resolve({ status: true, result: result});
      }
    });
  });
}

admin_certificate.CertificateRearrangeModel = async function CertificateRearrangeModel() {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM old_bttc_certificates ORDER BY SerialNO ASC', function(error, result, fields) {
      if(error) {
        reject({ status: false, err: error });
      } else {        
        _.each(result, function(v, k) {
          // console.log("V", v);
          let data = {
            serial_no: v.SerialNO,
            s_name: v.Name,
            f_name: v.FathersName,
            m_name: v.MothersName,
            session: v.Session,
            course_title: v.CourseTitle,
            passing_year: v.PassedYear,
            result: v.Result.trim().replace(/['"]+/g, ''),
          };
          // console.log(data)
          // db.query('INSERT INTO new_old_nyttc_certificates SET ?', [data], function(error, result, fields) {
          //   if(error) {
          //     console.log("Save problem ", error);
          //   } else {
          //     console.log(data)
          //     console.log("Saved Successfully, Insert ID = ", result.insertId, "\n")
          //   }
          // });
        });        
        resolve({ status: true, result: result });
      }
    });
  });
}

admin_certificate.FoundCertificateModel = async function FoundCertificateModel(data) {
  return new Promise((resolve,reject)=>{
    if(data.s_name != '') {
      let sql = 'SELECT * FROM new_old_nyttc_certificates WHERE s_name LIKE "%'+data.s_name+'%"';
      // console.log(sql)
      db.query(sql, [data.s_name], function(error, result, fields) {
        if(error) {
          reject({ status: false, err: error });
        } else {
          // console.log("certificate", result);
          resolve({ status: true, result: result});
        }
      });
    } else if(data.serial_no != '') {
      db.query('SELECT * FROM new_old_nyttc_certificates WHERE serial_no = ?', [data.serial_no], function(error, result, fields) {            
        if(error) {
          reject({ status: false, err: error });
        } else {
          // console.log("certificatevv", result);
          resolve({ status: true, result: result});
        }
      });
    } else {
      reject({ status: false, err: 'Unable to find Certificates' });
    }    
  });
}

admin_certificate.CertificateEditRequestModel = async function CertificateEditRequestModel(certificate_id, user_id) {
  return new Promise((resolve,reject)=>{
    // if no other update request pending
    db.query('UPDATE new_old_bttc_certificates SET update_request = 1, update_req_user_id = ? WHERE id = ?', [user_id, certificate_id], function(error, result, fields) {
      if(error) {
        reject({ status: false, err: error });
      } else {
        resolve({ status: true, result: result});
      }
    });
  });
}

admin_certificate.IsCertEditReqExistModel = async function IsCertEditReqExistModel(certificate_id) {
  return new Promise((resolve,reject)=>{
    // if no other update request pending
    db.query('SELECT * FROM new_old_nyttc_certificates WHERE id = ? ', [certificate_id], function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        resolve({ status: true, result: result});
      }
    });
  });
}

admin_certificate.CertificateDataRecallAndInsetToBackupModel = async function CertificateDataRecallAndInsetToBackupModel(certificate_id, user_id) {
  return new Promise((resolve,reject)=>{
    // Backup Update data
    db.query('SELECT * FROM new_old_bttc_certificates WHERE id = ? ', [certificate_id], function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("re call update req-------", result);
        db.query('INSERT INTO update_backup_certificates SET ?', [result[0]], function(error, result2, fields) {            
          if(error) {
            reject({ status: false, err: error });
          } else {
            // console.log("Inserted===", result2);
            resolve({ status: true, result: result2});
          }
        });
      }
    });
  });
}

admin_certificate.GetoldCertInfoByIdModel = async function GetoldCertInfoByIdModel(user_id, certificate_id) {
  return new Promise((resolve, reject)=>{
      db.query('SELECT * FROM new_old_bttc_certificates WHERE (update_request = 1 OR update_request = 2) AND id = ?', [certificate_id], function(error, result, fields) {            
          if(error) {
              reject({ status: false, err: error });
          } else {
              resolve({ status: true, result: result});
          }
      });
  });
}

admin_certificate.CertUpdateByIdModel = async function CertUpdateByIdModel(_update_data, id) {
  return new Promise((resolve, reject)=>{
      db.query('UPDATE new_old_nyttc_certificates SET ?, is_insert_or_update=is_insert_or_update+1 WHERE id = ?', [_update_data, id], function(error, result, fields) {            
          if(error) {
              reject({ status: false, err: error });
          } else {
              resolve({ status: true, result: result});
          }
      });
  });
}

admin_certificate.updateBackupCertificateStatusModel = async function updateBackupCertificateStatusModel(id, serial_no) {
  return new Promise((resolve, reject)=>{
      db.query('UPDATE update_backup_certificates SET status = 1 WHERE id = ? AND serial_no = ? ORDER BY backup_id DESC LIMIT 1', [id, serial_no], function(error, result, fields) {            
          if(error) {
              reject({ status: false, err: error });
          } else {
              resolve({ status: true, result: result});
          }
      });
  });
}

admin_certificate.CheckCertUpdatePermissionModel = async function CheckCertUpdatePermissionModel(certificate_id, user_id) {
  return new Promise((resolve, reject)=>{
      db.query('SELECT * FROM new_old_bttc_certificates WHERE (update_request = 1 OR update_request = 2) AND update_req_user_id = ? AND id = ?', [user_id, certificate_id], function(error, result, fields) {            
          if(error) {
              reject({ status: false, err: error });
          } else {
              resolve({ status: true, result: result});
          }
      });
  });
}

admin_certificate.CertEditReqCancelModel = async function CertEditReqCancelModel(certificate_id, user_id) {
  return new Promise((resolve, reject)=>{
      db.query('UPDATE new_old_bttc_certificates SET update_request = "3", updated_by = ? WHERE id = ?', [user_id, certificate_id], function(error, result, fields) {            
          if(error) {
              reject({ status: false, err: error });
          } else {
              resolve({ status: true, result: result});
          }
      });
  });
}

admin_certificate.AllowEditReqModel = async function AllowEditReqModel(certificate_id, user_id) {
  return new Promise((resolve, reject)=>{
      db.query('UPDATE new_old_bttc_certificates SET update_request = "2", updated_by = ? WHERE id = ?', [user_id, certificate_id], function(error, result, fields) {            
          if(error) {
              reject({ status: false, err: error });
          } else {
              resolve({ status: true, result: result});
          }
      });
  });
}

admin_certificate.IsAllowEditReqForCurrentUserModel = async function IsAllowEditReqForCurrentUserModel(certificate_id, user_id) {
  return new Promise((resolve, reject)=>{
      db.query('SELECT * FROM new_old_bttc_certificates WHERE update_request = "2" AND update_req_user_id = ? AND id = ?', [user_id, certificate_id], function(error, result, fields) {            
          if(error) {
              reject({ status: false, err: error });
          } else {
              resolve({ status: true, result: result});
          }
      });
  });
}

module.exports = admin_certificate;