// var bcrypt = require('bcryptjs');
// var _ = require("lodash");
// // var models = require("../../models/login");

// class AdminLoginService {
//     constructor() {
//       this.MODELS = models;
//       this.CurrentUserType = {
//         super_admin : 1,
//         admin       : 2,
//         employee    : 3,
//         student     : 4,
//       }
//     }

//     async GetUserIfEmailPasswordMatchService(email, password) {
//       try {
//           let user_email = email;
//           let user_password = password;
//         //bcryptjs
//         const userInfo = await MODELS.GetUserIfEmailPasswordMatchModel(user_email, user_password);
//         if(userInfo.status && userInfo.result.length > 0) {
//             // let attr = {};
//             // if(arrangedCollection) {
//             //   return {
//             //     status: true,
//             //     product: arrangedCollection
//             //   }
//             // } else {
//             //   return {
//             //     status: false,
//             //     err: 'Something Went Wrong From Top Product Collection.'
//             //   }
//             // }
//         } else {
//           return {
//             status: false,
//             err: 'Incorrect User or Password Otherwise Both.'
//           }
//         }
//       } catch(err) {
//         return {
//           status: false,
//           err: err
//         }
//       }
//   }
    
// }

// module.exports = AdminLoginService;