const studentPhoto = {};

studentPhoto.SearchStudentsModel = function SearchStudentsModel(term, limit) {
  return new Promise((resolve, reject) => {
    const like = '%' + term + '%';
    const sql = `SELECT id, serial_no, s_name, f_name, m_name, session, course_title, passing_year, result, is_approved, photo_path, photo_updated_at, photo_updated_by
      FROM new_old_nyttc_certificates
      WHERE serial_no = ? OR serial_no LIKE ? OR s_name = ? OR LOWER(s_name) LIKE LOWER(?)
      ORDER BY CASE WHEN serial_no = ? THEN 0 WHEN s_name = ? THEN 1 WHEN serial_no LIKE ? THEN 2 ELSE 3 END, id DESC
      LIMIT ?`;
    db.query(sql, [term, like, term, like, term, term, like, limit], (error, result) => {
      if (error) reject({ status: false, err: error });
      else resolve({ status: true, result });
    });
  });
};

studentPhoto.GetStudentByIdModel = function GetStudentByIdModel(studentId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT id, serial_no, s_name, f_name, m_name, session, course_title, passing_year, result, is_approved, photo_path, photo_updated_at, photo_updated_by FROM new_old_nyttc_certificates WHERE id = ? LIMIT 1', [studentId], (error, result) => {
      if (error) reject({ status: false, err: error });
      else resolve({ status: true, result });
    });
  });
};

studentPhoto.UpdateStudentPhotoPathModel = function UpdateStudentPhotoPathModel(studentId, photoPath, userId) {
  return new Promise((resolve, reject) => {
    db.query('UPDATE new_old_nyttc_certificates SET photo_path = ?, photo_updated_at = NOW(), photo_updated_by = ? WHERE id = ?', [photoPath, userId, studentId], (error, result) => {
      if (error) reject({ status: false, err: error });
      else resolve({ status: true, result });
    });
  });
};

studentPhoto.LogPhotoActivityModel = function LogPhotoActivityModel(data) {
  return new Promise((resolve) => {
    db.query('INSERT INTO student_photo_activity_logs SET ?', [data], (error, result) => {
      if (error) {
        console.log('Student photo activity log failed', error.message || error);
        resolve({ status: false, err: error });
      } else resolve({ status: true, result });
    });
  });
};

module.exports = studentPhoto;
