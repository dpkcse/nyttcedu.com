const common = {};

common.GetAllDepartmentListModel = async function GetAllDepartmentListModel(){
  return new Promise((resolve,reject)=>{        
    db.query('SELECT * FROM departments', function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("departments", result)
        resolve({ status: true, result: result});
      }
    });
  });
}

common.GetAllDesignationListModel = async function GetAllDesignationListModel(){
  return new Promise((resolve,reject)=>{        
    db.query('SELECT * FROM designations', function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("designations", result)
        resolve({ status: true, result: result});
      }
    });
  });
}

common.GetAllEmployeeListModel = async function GetAllEmployeeListModel(){
  return new Promise((resolve,reject)=>{        
    db.query('SELECT * FROM employees WHERE status=1', function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("employees", result)
        resolve({ status: true, result: result});
      }
    });
  });
}

common.GetAllCourseDurationListModel = async function GetAllCourseDurationListModel(){
  return new Promise((resolve,reject)=>{        
    db.query('SELECT * FROM course_durations', function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        resolve({ status: true, result: result});
      }
    });
  });
}

common.GetAllStudentListModel = async function GetAllStudentListModel(){
  return new Promise((resolve,reject)=>{        
    db.query('SELECT * FROM students', function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        resolve({ status: true, result: result});
      }
    });
  });
}

common.VerifyableCertNoForNotificationModel = async function VerifyableCertNoForNotificationModel(){
  return new Promise((resolve,reject)=>{        
    db.query('SELECT COUNT(id) AS verify_no FROM new_old_bttc_certificates WHERE is_approved = 0', function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("result", result);
        resolve({ status: true, result: result});
      }
    });
  });
}

common.EditRequestCertNoForNotificationModel = async function EditRequestCertNoForNotificationModel() {
  return new Promise((resolve,reject)=>{
    db.query('SELECT COUNT(id) AS editable_no FROM new_old_bttc_certificates WHERE update_request != 0 AND update_req_user_id != ""', function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("result", result);
        resolve({ status: true, result: result});
      }
    });
  });
}

module.exports = common;