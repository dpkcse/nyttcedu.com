const _ = require("lodash");
// const homeModels = require("../../models/home");
const commonModels = require("../../models/common");
const isEmpty = require('../../validation/is-empty');

class CommonService {
    constructor() {
        this.COMMON_MODELS = commonModels;
    }
    async GetAllDepartmentListService() {
        try {
            const deptList = await this.COMMON_MODELS.GetAllDepartmentListModel();
            if(deptList.status && deptList.result.length > 0) {                
                return {
                    status: true,
                    result: deptList.result
                }
            } else {
                return {
                    status: false,
                    err: 'No On Job Employee Found.'
                }
            }
        } catch(err) {
            console.log(err);
            return {
                status: false,
                err: 'Department Found Error.'
            }
        }        
    }
    async GetAllDesignationListService() {
        try {
            const desigList = await this.COMMON_MODELS.GetAllDesignationListModel();
            if(desigList.status && desigList.result.length > 0) {
                _.each(desigList.result, (v, k) => {
                    v.designation_title = v.designation_title.split(" ").map((word) => { 
                        return word[0].toUpperCase() + word.substring(1); 
                    }).join(" ");
                });
                return {
                    status: true,
                    result: desigList.result
                }
            } else {
                return {
                    status: false,
                    err: 'No Designation Found.'
                }
            }            
        } catch(err) {
            console.log(err);
            return {
                status: false,
                err: 'Designation Found Error.'
            }
        }
    }
    async GetAllEmployeeListService() {
        try {
            const empList = await this.COMMON_MODELS.GetAllEmployeeListModel();
            if(empList.status && empList.result.length > 0) {
                return {
                    status: true,
                    result: empList.result
                }
            } else {
                return {
                    status: false,
                    err: 'No Empoyee Found.'
                }
            }            
        } catch(err) {
            console.log(err);
            return {
                status: false,
                err: 'Empoyee Found Error.'
            }
        }
    }
    async get_loged_in_user_info(req) {
        let notificatin_no = 0;
        let verify_cert_no = await this.COMMON_MODELS.VerifyableCertNoForNotificationModel();
        let edit_cert_no = await this.COMMON_MODELS.EditRequestCertNoForNotificationModel();
        if(verify_cert_no.status && edit_cert_no.status) {
            notificatin_no = parseInt(verify_cert_no.result[0].verify_no) + parseInt(edit_cert_no.result[0].editable_no);
        }
        // var userTypeObj = {
        //     '1' : 'Super Admin',
        //     '2' : 'Admin',
        //     '3' : 'Normal User',
        // };
        return {
            user_id: req.user.user_id,
            user_type: req.user.user_type,
            emp_id: req.user.emp_id,
            email: req.user.email,
            name: req.user.emp_name,
            mobile_no: req.user.mobile_no,
            employee_id: req.user.employee_id,
            designation_id: req.user.designation_id,
            status: req.user.status,
            // notificaion_no: (req.user.user_type == 1 || req.user.user_type == 2) ? (verify_cert_no.status ? verify_cert_no.result[0].verify_no : 0) : 0,
            notificaion_no: (req.user.user_type == 1 || req.user.user_type == 2) ? notificatin_no : 0,
        };
        
    }
}

module.exports = CommonService;