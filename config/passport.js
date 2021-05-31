const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const isEmpty = require('../validation/is-empty');
var _ = require('lodash');
// Load User model
// const User = require('../models/User');

// var {
//   get_employee_details,
//   get_userAccessUtils
// } = require('../utils/employee');

module.exports = function (passport) {
  passport.use(
    new LocalStrategy({
      usernameField: 'email'
    }, (email, password, done) => {
      // Match user for admin login
      db.query('SELECT * FROM `users` WHERE `email` = ? AND (user_type = "1" OR user_type = "2" OR user_type = "3")',[email], async function (error, result, fields) {
        if(error) {
          console.log(error);
          return done(null, false, {
            message: 'System Error Faced, LogIn may be data not found'
          });
        } else {
          if (result.length == 1) {

            bcrypt.compare(password, result[0].password, (err, isMatch) => {
              if (err) throw err;
              if (isMatch) { //return true or false
                let data = {
                  user_id: result[0].user_id,
                  email: result[0].email,
                  emp_id: result[0].emp_id,
                  user_type: result[0].user_type,
                  reset_pass: result[0].reset_pass,
                };
                return done(null, data);
              } else {
                return done(null, false, {
                  message: 'Incorrect Password'
                });
              }
            });
          } else {
            console.log("Find one more users")
            if(result.length > 1) {
              return done(null, false, {
                message: 'That email is registered as one more address'
              });
            } else {
              return done(null, false, {
                message: 'That email is not registered as any user type'
              });
            }            
          }
        }
      });
    })
  );

  passport.serializeUser(function (user, done) {
    // console.log("dddddddddddd")
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    if(user.user_type == "1" || user.user_type == "2" || user.user_type == "3") {
      //admin login = Data From Employee Table
      db.query('SELECT * FROM employees WHERE employee_id=? AND status = "1"',[user.emp_id], async function (error, result, fields) {
        if(error) {
          console.log(error);
          return done(null, false, {
            message: 'System Error Faced'
          });
        } else {
          if (result.length == 1) {
            let user_data = user;
            user_data.employee_id = result[0].employee_id;
            user_data.emp_name = result[0].emp_name;
            user_data.designation_id = result[0].designation_id;
            user_data.mobile_no = result[0].mobile_no;
            user_data.status = result[0].status;
            // console.log(user_data);
            // console.log("SSSSSSSSSSSSS")
            done(error, user_data);
          } else {
            return done(null, false, {
              message: 'Something went wrong! You are not on job now.'
            });
          }
        }
      });
    } else {
      return done(null, false, {
        message: 'Something went wrong! You are not on job now.'
      });
      // if Stuent user_type == 4
      // db.query('', async function (error, result) {
      // });
    }
  });
};