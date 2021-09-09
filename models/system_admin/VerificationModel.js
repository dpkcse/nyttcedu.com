const verification = {};

verification.GetVerifyNeededCertificatesModel = async function GetVerifyNeededCertificatesModel(){
  return new Promise((resolve,reject)=>{        
    db.query('SELECT * FROM new_old_nyttc_certificates WHERE is_approved = 0', function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("Verification", result);
        resolve({ status: true, result: result});
      }
    });
  });
}

verification.VerifyCertificateModel = async function VerifyCertificateModel(id){
  return new Promise((resolve,reject)=>{        
    db.query('UPDATE new_old_nyttc_certificates SET is_approved = 1 WHERE id = ?', [id], function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("Verified", result);
        resolve({ status: true, result: result});
      }
    });
  });
}

verification.DeleteCertificateModel = async function DeleteCertificateModel(id){
  return new Promise((resolve,reject)=>{        
    db.query('DELETE FROM new_old_nyttc_certificates WHERE is_approved = 0 AND id = ?', [id], function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("Verified", result);
        resolve({ status: true, result: result});
      }
    });
  });
}

verification.GetEditRequestCertificatesModel = async function GetEditRequestCertificatesModel(){
  return new Promise((resolve,reject)=>{        
    db.query('SELECT * FROM new_old_bttc_certificates WHERE update_request = 1 OR update_request = 2', function(error, result, fields) {
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("update req", result);
        resolve({ status: true, result: result});
      }
    });
  });
}

verification.GetAllNotRepliedMessagesModel = async function GetAllNotRepliedMessagesModel(){
  return new Promise((resolve,reject)=>{        
    db.query('SELECT * FROM contact_msg WHERE status = 0 ORDER BY id DESC', function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("contact_msg", result);
        resolve({ status: true, result: result});
      }
    });
  });
}



module.exports = verification;