const certification = {};

certification.GetResultInfoBySerialModel = async function GetResultInfoBySerialModel(serial_no) {
    return new Promise((resolve, reject)=>{         
        // db.query('SELECT * FROM new_old_bttc_certificates WHERE serial_no = ? AND is_approved = 1', [serial_no], function(error, result, fields) {            
        db.query('SELECT * FROM new_old_bttc_certificates WHERE serial_no = ?', [serial_no], function(error, result, fields) {            
            if(error) {
                reject({ status: false, err: error });
            } else {
                // console.log("old_bttc_certificates =======================", result);
                // console.log("serial_no =======================", serial_no);
                resolve({ status: true, result: result});
            }
        });
    });
}



module.exports = certification;