const home = {};

home.CourseNoDeptWiseListModel = async function CourseNoDeptWiseListModel(dept_unique_name, department_id){
    return new Promise((resolve,reject)=>{
        db.query('SELECT COUNT(department_id) as ? FROM courses WHERE department_id = ? AND status = 1', [dept_unique_name, department_id], function(error, result, fields) {            
            if(error) {
                reject({ status: false, err: error });
            } else {
                resolve({ status: true, result: result});
            }
        });
    });
}


module.exports = home;