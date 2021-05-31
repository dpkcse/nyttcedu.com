const login = {};

login.GetUserIfEmailPasswordMatchModel = async function GetUserIfEmailPasswordMatchModel(email, password){
  return new Promise((resolve,reject)=>{        
    db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        resolve({ status: true, result: result});
      }
    });
  });
}


module.exports = login;