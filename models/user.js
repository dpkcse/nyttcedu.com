const user = {};

user.GetEmpListModel = async function GetEmpListModel() {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM employees WHERE status=1', function(error, result, fields){
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("result", result);
                resolve({ status: true, result: result });
            }
        });
    });
}
user.GetAsingleEmpByIdModel = async function GetAsingleEmpByIdModel(employee_id) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM employees WHERE status=1 AND employee_id = ?', [employee_id], function(error, result, fields){
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("result", result);
                resolve({ status: true, result: result });
            }
        });
    });
}
user.GetAdminUsersListModel = async function GetAdminUsersListModel() {
    return new Promise((resolve, reject) => {
        db.query('SELECT user_id, email, emp_id, user_type, status FROM users WHERE is_delete = 0', function(error, result, fields){
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("result", result)
                resolve({ status: true, result: result });
            }
        });
    });
}
user.CheckUserEmailAlreadyExitOrNotModel = async function CheckUserEmailAlreadyExitOrNotModel(email) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM users WHERE email = ? AND is_delete = 0', [email], function(error, result, fields) {
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("result 1", result)
                resolve({ status: true, result: result });
            }
        });
    });
}
user.CreateNewSystemUserModel =  async function CreateNewSystemUserModel(user) {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO users SET ?', [user], function(error, result, fields) {
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("result", result)
                resolve({ status: true, result: result });
            }
        });
    });
}

user.GetUserCurrentPasswordModel = async function GetUserCurrentPasswordModel(user_email, user_id, user_status) {
    return new Promise((resolve, reject) => {
        db.query('SELECT password FROM users WHERE user_id = ? AND email = ? AND status = ?', [user_id, user_email, user_status], function(error, result, fields) {
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("result", result)
                resolve({ status: true, result: result });
            }
        });
    });
}

user.ChangeUserPasswordModel = async function ChangeUserPasswordModel(hash, user_email, user_id, user_status){
    return new Promise((resolve, reject) => {
        // $2a$10$2vyjmEF0QAtp4KnyXyjqv./4yHJp5SRT.KzFV.5Igp.qV.92DF9sW = 123456
        db.query('UPDATE users SET password =?, updated_by = ? WHERE user_id = ? AND email = ? AND status = ?', [hash, user_id, user_id, user_email, user_status], function(error, result, fields) {
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("result", result)
                resolve({ status: true, result: result });
            }
        });
    });
}

user.UpdateUserTokenModel = async function UpdateUserTokenModel(useremail, token){
    return new Promise((resolve, reject) => {
        db.query('UPDATE users SET reset_pass_token = ? WHERE email = ? ', [ token, useremail ], function(error, result, fields) {
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("result", result)
                resolve({ status: true, result: result });
            }
        });
    });
}
user.ResetUserTokenAfterSomeTimeModel = async function ResetUserTokenAfterSomeTimeModel(useremail, token){
    return new Promise((resolve, reject) => {
        db.query('UPDATE users SET reset_pass_token = "" WHERE email = ? AND reset_pass_token = ? ', [ useremail, token ], function(error, result, fields) {
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("result", result)
                resolve({ status: true, result: result });
            }
        });
    });
}

user.UpdatePassUserTokenModel = async function UpdatePassUserTokenModel(hash, useremail, reset_token){
    // zyEAq8fW0JKBEeyO1qnR2WVmI0YcsDskxqz5VEEsjricnmHdgxSBcw2usnTDpbjDvoM6DFh1qsivSk0QzvubFlMZdUWVktpuYHuz
    return new Promise((resolve, reject) => {
        db.query('UPDATE users SET reset_pass_token = "", password = ?  WHERE email = ? AND reset_pass_token = ? AND status = 1', [ hash, useremail, reset_token ], function(error, result, fields) {
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("result", result)
                resolve({ status: true, result: result });
            }
        });
    });
}

user.IsTokenPresentModel = async function IsTokenPresentModel(useremail){
    return new Promise((resolve, reject) => {
        //Same email is not able to 2 id, Allow only one id per email
        db.query('SELECT reset_pass_token FROM users WHERE email = ? AND status = 1', [ useremail], function(error, result, fields) {
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("result", result);
                resolve({ status: true, result: result });
            }
        });
    });
}








// user.CheckUserAlreadyExistOrNot = async function CheckUserAlreadyExistOrNot(email){
//     return new Promise((resolve,reject)=>{
//         db.query('SELECT * FROM customer_login WHERE email = ?', [email], function(error, result, fields) {            
//             if(error) {
//                 reject({ status: false, err: error });
//             } else {
//                 // console.log("email Details ==========================", result);
//                 resolve({ status: true, result: result});
//             }
//         });
//     });
// }

// user.SaveNewCustomerInfoModels = async function SaveNewCustomerInfoModels(dataCus, dataLrllc){
//     return new Promise((resolve,reject)=>{
//         let sqlLrc = "INSERT INTO lrllc_customer SET ?";
//         db.query(sqlLrc, [dataLrllc], function(error, resultLrllcCus, fields) {
//             if(error) {
//                 reject({ status: false, err: error });
//             } else {
//                 // console.log("Lrllc_customer Save ==========================", resultLrllcCus);
//                 dataCus.lrllc_customer_id = resultLrllcCus.insertId;
//                 let sqlLogin = "INSERT INTO customer_login SET ?";
//                 db.query(sqlLogin, [dataCus], function(error, resultCusLogin, fields) {
//                     if(error) {
//                         reject({ status: false, err: error + ' == Customer Save But Login Not Saved.' });
//                     } else {
//                         resolve({ status: true, result: resultCusLogin });
//                         // console.log("lrllc_customer Save ==========================", resultCusLogin);
//                     }
//                 });
//             }
//         });
//     });
// }

// user.GetAUserInfoByEmailModels = async function GetAUserInfoByEmailModels(data) {
//     return new Promise((resolve, reject) => {
//         let sql = "SELECT * FROM customer_login WHERE email = ?";
//         db.query(sql, [data.email], function(error, result, fields) {
//             if(error) {
//                 reject({status: false, err: error });
//             } else {
//                 resolve({status: true, result: result });
//             }
//         });
//     });
// }

// user.LoginCustomerInformationModel = async function LoginCustomerInformationModel(email, customerId) {
//     return new Promise ((resolve, reject) => {
//         let sql = "SELECT * FROM lrllc_customer WHERE email = ? AND id = ?";
//         db.query(sql, [email, customerId], function(error, result, fields) {
//             if(error) {
//                 reject({ status: false, err: error });
//             } else {
//                 // console.log("result==========", result)
//                 resolve({ status: true, result: result });
//             }
//         });
//     });
// }

module.exports = user;