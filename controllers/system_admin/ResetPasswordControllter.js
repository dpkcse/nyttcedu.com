var _ = require("lodash");
var moment = require('moment');
var url = require('url') ;
const UserService = require( "../../services/User/UserService");

var self = (module.exports = {
  ResetPassAdminReady : async function (req, res, next) {
		try {
      let useremail = req.query.useremail;
      let token     = req.query.token;

			let data = {
        useremail: useremail,
        token: token,
        moment: moment,
        _:_,				
      };
      const UserServiceIns = new UserService();
			var resetToken = await UserServiceIns.IsResetAndTokenAvailableService(useremail, token);
      // console.log("resetToken22 = ", resetToken)
      if(resetToken.status) {
        data.is_resetable = resetToken.status;
      } else {
        data.is_resetable = resetToken.status;
      }
			res.render('system_admin/password/reset_admin_password', data);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

  ResetPassAdminSet : async function (req, res, next) {
    try {
      let data = {
        useremail       : req.body.useremail,
        reset_token     : req.body.reset_token,
        new_password    : req.body.new_password,
        re_new_password : req.body.re_new_password,
      };
      // console.log("data = ", data);
      const UserServiceIns = new UserService();
			var changePasswordFromReset = await UserServiceIns.ChangePassordFromResetService(data);
      // console.log("changePasswordFromReset = ", changePasswordFromReset);
      res.send(changePasswordFromReset);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
  },

  ResetPassByMenualAdminOnly : async function(req, res, next) {
    try {
      let data = {
        user_id   : req.body.user_id.trim(),
        emp_id    : req.body.emp_id.trim(),
        user_type : req.body.user_type.trim(),
      }
      // console.log("user_id = ", data.user_id);
      // console.log("emp_id = ", data.emp_id);
      // console.log("user_type = ", data.user_type);

      const UserServiceResetIns = new UserService();
      var reset_by_admin = await UserServiceResetIns.ResetPassByAdminService(data);
      // console.log("reset_by_admin = ", reset_by_admin);      
      res.send(reset_by_admin);      
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  
});