var moment = require('moment');
const AdminLoginService = require( "../../services/SystemAdmin/AdminLoginService");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const _ = require("lodash");
// const User = require('../models/User');
const { forwardAuthenticated, ensureAuthenticated } = require("../../config/auth");


var self = (module.exports = {
	AdminLoginForm : async function (req, res, next) {
		try {
			let isLogedIn = req.isAuthenticated();
			let data = {
				title : 'Admin Login',
				moment: moment,
				_:_
			};
			if(!isLogedIn) {
				res.render('system_admin/login.ejs', data);
			} else {
				res.redirect("/dashboard");
			}			
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

	CheckUserPasswordLogin : async function(req, res, next) {
		try {
			passport.authenticate("local", {
				successRedirect: "/dashboard",
				failureRedirect: "/admin-login",
				failureFlash: true,
			})(req, res, next);
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

	LogoutUserAdmin : async function(req, res, next) {
		try {
			req.logout();			
			req.flash("success_msg", "You are successfully logged out");
			res.redirect("/admin-login");
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

	LogoutGoLiveHomeUserAdmin : async function(req, res, next) {
		try {
			req.logout();
			res.redirect("/");
		} catch(err) {
			console.log(err);
			res.status(500).json(err);
		}
	},

});