const course = {};

course.SaveCourseModel = async function SaveCourseModel(data){
  return new Promise((resolve,reject)=>{        
    db.query('INSERT INTO courses SET ?', [data], function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        resolve({ status: true, result: result});
      }
    });
  });
}
course.GetAllCoursesForAdminPanelModel = async function GetAllCoursesForAdminPanelModel(){
  return new Promise((resolve,reject)=>{        
    db.query('SELECT * FROM courses ORDER BY course_type ASC, department_id ASC, sequence ASC', function(error, result, fields) {            
      if(error) {
        reject({ status: false, err: error });
      } else {
        // console.log("courses result", result);
        resolve({ status: true, result: result});
      }
    });
  });
}

module.exports = course;