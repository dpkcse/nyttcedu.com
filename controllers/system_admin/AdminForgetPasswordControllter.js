var _ = require("lodash");
var moment = require('moment');
var url = require('url') ;
const UserService = require( "../../services/User/UserService");

var self = (module.exports = {
	AdminPreparationResetPassView : async function (req, res, next) {
		try {
			let data = {
        moment: moment,
        _:_,				
      };
			res.render('system_admin/password/admin_forget_password', data);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

  AdminPreparationPasswordReset : async function (req, res, next) {
    try {
      let useremail = req.body.useremail;
      var hostname = req.headers.host;
      var originalUrl = req.originalUrl;
      var protocol = req.protocol;
      // var url = req.url;      
      // console.log("hostname =",   protocol, hostname, originalUrl);
      var current_url = protocol + '://' + hostname + '/reset-admin-password';
      // console.log("current_url", current_url)
      const UserServiceIns = new UserService();
			var resetPass = await UserServiceIns.AdminResetSendMailService(useremail, current_url);      
      // console.log("resetPass", resetPass)
      res.send(resetPass);

		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
  },
});