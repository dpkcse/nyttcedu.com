const contact = {};

contact.SaveAndSendMsgModel = async function SaveAndSendMsgModel(data){
    return new Promise((resolve,reject)=>{
        db.query('INSERT INTO contact_msg SET ?', [data], function(error, result, fields) {            
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("MSg ==========================", result);
                resolve({ status: true, result: result});
            }
        });
    });
}

contact.SubscribeEmailIsExistModel = async function SubscribeEmailIsExistModel(data){
    return new Promise((resolve,reject)=>{
        db.query('SELECT email FROM subscribers WHERE email = ?', [data], function(error, result, fields) {            
            if(error) {
                reject({ status: false, err: error });
            } else {
                console.log("email ==========================", result);
                resolve({ status: true, result: result});
            }
        });
    });
}

contact.SubscribeEmailModel = async function SubscribeEmailModel(data){
    return new Promise((resolve,reject)=>{
        db.query('INSERT INTO subscribers (email) VALUES (?)', [data], function(error, result, fields) {            
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("MSg ==========================", result);
                resolve({ status: true, result: result});
            }
        });
    });
}

module.exports = contact;