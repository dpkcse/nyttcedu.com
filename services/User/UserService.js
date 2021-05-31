var _ = require("lodash");
var bcrypt = require('bcryptjs');
var moment = require('moment');
var randtoken = require('rand-token');

var MailService = require("../Mail/SendMailService");
var CommonService = require("../Common/CommonService");
var userModels = require("../../models/user");

class UserService {
    constructor() {
        this.USER_MODELS = userModels;
    }
    //Start admin part
        async GetEmpListService() {
            try {
                const empList = await this.USER_MODELS.GetEmpListModel();
                if(empList.status && empList.result.length > 0) {
                    _.each(empList.result, (v, k) => {
                        v.emp_name = v.emp_name.split(" ").map((word) => { 
                            return word[0].toUpperCase() + word.substring(1); 
                        }).join(" ");
                    });
                    return {
                        status: true,
                        result: empList.result
                    }
                } else {
                    return {
                        status: false,
                        err: 'No On Job Employee Found.'
                    }
                }
            } catch(err) {
                console.log("UserSrv = ", err);
                return {
                    status: false,
                    err: 'On Job Employee Found Error.'
                }
            }
        }
        async GetAdminUsersListService() {
            try {
                var userTypeObj = {
                    '1' : 'Super Admin',
                    '2' : 'Admin',
                    '3' : 'Normal User',
                };
                var empStatusObj = {
                    '1' : 'On Job',
                    '2' : 'On Leave',
                    '3' : 'Resigned',
                    '4' : 'Transfered',
                    '5' : 'Quit',
                };
                var deptObj = {};
                var desigObj = {};
                var empObj = {};
                var userListArr = [];
                
                var usersList = await this.USER_MODELS.GetAdminUsersListModel();
                if(usersList.status && usersList.result.length > 0) {
                    let CommonServIns = new CommonService();
                    const departments = await CommonServIns.GetAllDepartmentListService();
                    const designations = await CommonServIns.GetAllDesignationListService();
                    const employees = await CommonServIns.GetAllEmployeeListService();
                    if(departments.status && departments.result.length > 0){
                        _.each(departments.result, (v, k) => {
                            deptObj[v.department_id] = v.department_name;
                        });
                    }
                    if(designations.status && designations.result.length > 0){
                        _.each(designations.result, (v, k) => {
                            desigObj[v.designation_id] = v.designation_title.split(" ").map((word) => { 
                                return word[0].toUpperCase() + word.substring(1);
                            }).join(" ");;
                        });
                    }
                    if(employees.status && employees.result.length > 0){
                        _.each(employees.result, (v, k) => {
                            empObj[v.employee_id] = {
                                employee_id     : v.employee_id,
                                emp_name        : v.emp_name.split(" ").map((word) => { 
                                    return word[0].toUpperCase() + word.substring(1);
                                }).join(" "),
                                email           : v.email,
                                designation_id  : v.designation_id,
                                department_id   : v.department_id,
                                mobile_no       : v.mobile_no,
                                status          : v.status,
                            };
                        });
                    }
                    // console.log("deptObj", deptObj)
                    // console.log("desigObj", desigObj)
                    // console.log("empObj", empObj)
                    _.each(usersList.result, (v, k) => {
                        userListArr.push({
                            user_id     : v.user_id,
                            email       : v.email,
                            emp_id      : v.emp_id,
                            emp_name    : empObj[v.emp_id].emp_name,
                            mobile_no           : empObj[v.emp_id].mobile_no,
                            designation_id      : empObj[v.emp_id].designation_id,
                            designation_text    : desigObj[empObj[v.emp_id].designation_id],
                            department_id       : empObj[v.emp_id].department_id,
                            department_text     : deptObj[empObj[v.emp_id].department_id],

                            employee_status       : empObj[v.emp_id].status,
                            employee_status_text  : empStatusObj[empObj[v.emp_id].status],

                            
                            user_type         : v.user_type,
                            user_type_text    : userTypeObj[v.user_type],
                            status           : v.status,
                            status_text      : v.status == '0' ? 'Inactive' : 'Active',
                            status_result    : v.status == '0' ? 'Not Loginable User Status' : 'Loginable User Status',
                        });
                    });
                    // console.log("userListArr", userListArr)
                    return {
                        status: true,
                        result: userListArr
                    }
                } else {
                    return {
                        status: false,
                        err: 'No Users Found.'
                    }
                }
            } catch(err) {
                console.log("UserSrv = ", err);
                return {
                    status: false,
                    err: 'User List Found Error.'
                }
            }
        }
        async CreateNewSystemUserService(employee_id, user_type, user_id) {
            try {
                let _employee_id = employee_id;
                let _user_type = user_type;
                let _user_id = user_id;
                let default_password = 'Bttc123456';
                let user = {                    
                    emp_id: _employee_id,
                    user_type: _user_type,
                    email : '',
                    password: '',
                    created_by: _user_id
                };
                
                let getSingleEmp = await this.USER_MODELS.GetAsingleEmpByIdModel(_employee_id);
                if(getSingleEmp.status && getSingleEmp.result.length == 1) {                    
                    user.email = getSingleEmp.result[0].email;                    
                    var salt = bcrypt.genSaltSync(10);
                    var hash = bcrypt.hashSync(default_password, salt);
                    user.password = hash;
                    console.log("user", user)
                    let userEmailExist = await this.USER_MODELS.CheckUserEmailAlreadyExitOrNotModel(user.email);
                    if(userEmailExist.status) {
                        //user already exist
                        console.log("userEmailExist.result.length", userEmailExist.result.length)
                        if(userEmailExist.result.length > 0) {
                            return {
                                status: false,
                                errMsg: 'This employee user already exist'
                            }
                        } else {
                            let createUsr = await this.USER_MODELS.CreateNewSystemUserModel(user);
                            console.log("CreateUse", createUsr)
                            if(createUsr.status) {
                                return {
                                    status: true,
                                    sucMsg: 'Employee user created successfully'
                                }
                            } else {
                                return {
                                    status: false,
                                    sucMsg: 'Unable to create user for DB err'
                                }
                            } 
                        }                        
                    } else {
                        return {
                            status: false,
                            sucMsg: 'Unable to create user for DB err'
                        }
                    }
                } else {
                    return {
                        status: false,
                        errMsg: 'Employee not found for create user' 
                    }
                }
            } catch(err) {
                return {
                    status: false,
                    errMsg: err 
                }
            }
        }
        async IsResetAndTokenAvailableService(useremail, tokenFromReq) {
            try {
                let isTokenPresent = await this.USER_MODELS.IsTokenPresentModel(useremail);
                if(isTokenPresent.status && isTokenPresent.result.length == 1) {
                    // console.log("xx", isTokenPresent.result[0].reset_pass_token, "xx");
                    let storedTokenFromDb = isTokenPresent.result[0].reset_pass_token;
                    if(storedTokenFromDb != '') {
                        if(storedTokenFromDb == tokenFromReq) {                            
                            return {
                                status: true,
                                sucMsg: ''
                            }
                        } else {
                            return {
                                status: false,
                                sucMsg: ''
                            }
                        }
                    } else {
                        return {
                            status: false,
                            errMsg: ''
                        }
                    }                    
                } else {
                    return {
                        status: false,
                        errMsg: ''
                    }
                }
            } catch(err) {
                return {
                    status: false,
                    err: err
                }
            }
        }
        async ChangeUserPasswordService(changePassData) {
            try {                
                // console.log(changePassData);
                let user_email = changePassData.user_email;
                let user_id = changePassData.user_id;            
                let user_status = changePassData.user_status;

                let current_pass = changePassData.current_pass;
                let new_pass = changePassData.new_pass;
                let re_new_pass = changePassData.re_new_pass;

                let db_current_pass = await this.USER_MODELS.GetUserCurrentPasswordModel(user_email, user_id, user_status);
                
                let dbPass_Hash = db_current_pass.result[0].password;
                let is_pass_match = bcrypt.compareSync(current_pass, dbPass_Hash);
                if(db_current_pass.status && is_pass_match) {
                    if(new_pass == re_new_pass) {
                        var salt = bcrypt.genSaltSync(10);
                        var hash = bcrypt.hashSync(new_pass, salt);
                        let change_pass = await this.USER_MODELS.ChangeUserPasswordModel(hash, user_email, user_id, user_status);
                        if(change_pass.status) {
                            return {
                                status: true,
                                sucMsg: 'Password changed successfully. You can login now with new password.'
                            }
                        } else {
                            return {
                                status: false,
                                errMsg: 'Password not changed due to technical problem, Try again later.'
                            }
                        }
                    } else {
                        return {
                            status: false,
                            errMsg: 'New Password and Re-Enter New Password doesnt match, try again.'
                        }
                    }
                } else {
                    return {
                        status: false,
                        errMsg: 'Current Password doesnt match, try again.' 
                    }
                }
            } catch(err) {
                return {
                    status: false,
                    err: err 
                }
            }
        }
        async AdminResetSendMailService(useremail, current_url) {
            try {
                var token = randtoken.generate(100);
                let updateToken = await this.USER_MODELS.UpdateUserTokenModel(useremail, token);      
                // console.log("111 updateToken = ", updateToken);
                if(updateToken.status && updateToken.result.changedRows == 1) {
                    let MailerIns = new MailService();
                    // console.log("current_url", current_url)
                    let updateToken = await MailerIns.MailToAdminResetPassword(useremail, token, current_url);
                    // console.log("updateToken", updateToken)
                    if(updateToken.status && updateToken.result.messageId) {
                        //reset tokenafter 15minutes = 900000
                        const timeoutObj = setTimeout(() => {
                            let resetToken = this.USER_MODELS.ResetUserTokenAfterSomeTimeModel(useremail, token); 
                        }, 900000);
                        return {
                            status: true,
                            sucMsg: 'Reset Info send Successfully, Check your mail.'
                        }
                    } else {
                        return {
                            status: false,
                            errMsg: 'Unable to Reset Password, Try again later.'
                        }
                    }
                } else {
                    return {
                        status: false,
                        errMsg: 'Unable to Reset Password, May be user email not found Try again later.'
                    }
                }
            } catch(err) {
                return {
                    status: false,
                    err: err
                }
            }
        }
        async ChangePassordFromResetService(data) {
            try {
                let useremail       = data.useremail;
                let reset_token     = data.reset_token;
                let new_password    = data.new_password;
                let re_new_password = data.re_new_password;
                if(new_password == re_new_password) {
                    var salt = bcrypt.genSaltSync(10);
                    var hash = bcrypt.hashSync(new_password, salt);
                    let changePassAndUpdateToken = await this.USER_MODELS.UpdatePassUserTokenModel(hash, useremail, reset_token);
                    // console.log("changePassAndUpdateToken",changePassAndUpdateToken)
                    if(changePassAndUpdateToken.status && changePassAndUpdateToken.result.changedRows == 1) {
                        return {
                            status: true,
                            sucMsg: 'Password Changed Successfully You can login Now.'
                        }
                    } else {
                        return {
                            status: false,
                            errMsg: 'Unable to change password, please try again later.'
                        }
                    }                    
                } else {
                    return {
                        status: false,
                        errMsg: 'New Password and Re-enter New Password doesnt match.'
                    }
                }
            } catch(err) {
                return {
                    status: false,
                    err: err
                }
            }
        }
    //End admin part

    
}

module.exports = UserService;