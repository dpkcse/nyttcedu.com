var moment = require("moment");
var _ = require("lodash")
const UserService = require("../../services/User/UserService");
const CommonService = require("../../services/Common/CommonService");

var self = (module.exports = {
  CratedUserView: async function (req, res, next) {
    try {
      const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
      const UserGetIns = new UserService();
      var empList = await UserGetIns.GetEmpListService();
      var adminUsers = await UserGetIns.GetAdminUsersListService();
      
      let data = {
        title: "Admin | User",
        menu: "User",
        sub_menu: "Create System User",
        route: "/admin-user",
        moment: moment,
        _ : _,
        user_info: user_info,
        employees: empList.status ? empList.result : [],
        admin_users: adminUsers.status ? adminUsers.result : [],
      };
      res.render("system_admin/user/admin_users.ejs", data);
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  CreateNewSystemUser: async function (req, res, next) {
    try {
      let employee_id = req.body.employee_id.trim();
      let user_type   = req.body.user_type.trim();
      let user_id   = req.user.user_id;
      if(user_type == 1) {
        // if you want to create super admin
        // res.status(200).json({ status: false, errMsg: 'Unable to create "Super Admin User". Please contact with developer.'});
        res.redirect('/admin-user');
      } else {
        const CreateUsrIns = new UserService();
        var createUser = await CreateUsrIns.CreateNewSystemUserService(employee_id, user_type, user_id);
        // res.status(200).json(createUser);
        res.redirect('/admin-user');
      }
    } catch(err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  ChangeUserPasswordGetView: async function (req, res, next) {
    try {
      const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
      const UserGetIns = new UserService();
      
      let data = {
        title: "Admin | User",
        menu: "User",
        sub_menu: "Change My Password",
        route: "/change-password",
        moment: moment,
        _ : _,
        user_info: user_info,
      };
      res.render("system_admin/user/change_user_password.ejs", data);
    } catch(err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  PostChangeUserPassword: async function (req, res, next) {
    try {
      const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);

      let changePassData = {
        // user_email    : req.body.user_id,
        // user_id       : req.body.user_id,
        user_email    : user_info.email,
        user_id       : user_info.user_id,
        current_pass  : req.body.current_pass,
        new_pass      : req.body.new_pass,
        re_new_pass   : req.body.re_new_pass,
        user_status   : user_info.status
      }
      // console.log(changePassData);
      
      const ChangeUsrPassIns = new UserService();
      var changePass = await ChangeUsrPassIns.ChangeUserPasswordService(changePassData);
      // console.log("changePass", changePass)
      if(changePass.status) {
        req.flash("success_msg", changePass.sucMsg);
      } else {
        if(changePass.errMsg) {
          req.flash("error_msg", changePass.errMsg);
        } else {
          req.flash("error", changePass.err);
        }
      }
      res.redirect('/admin-user/change-password');
    } catch(err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  
});
