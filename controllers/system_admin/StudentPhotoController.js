var moment = require('moment');
const CommonService = require('../../services/Common/CommonService');
const StudentPhotoService = require('../../services/SystemAdmin/Student/StudentPhotoService');

function jsonError(res, statusCode, message) {
  return res.status(statusCode).json({ status: false, success: false, errMsg: message });
}

module.exports = {
  index: async function(req, res) {
    try {
      const cmnIns = new CommonService();
      const user_info = await cmnIns.get_loged_in_user_info(req);
      const service = new StudentPhotoService();
      if (!service.canView(user_info)) {
        req.flash('errMsg', 'You do not have permission to manage student photos.');
        return res.redirect('/dashboard');
      }
      res.render('system_admin/student_photo_management', {
        title: 'Admin | Student Photo Management',
        menu: 'Certificates',
        sub_menu: 'Student Photos',
        route: '/certificate/student-photos',
        moment,
        user_info,
        can_manage_photos: service.canUpload(user_info),
        sucMsg: req.flash('sucMsg'),
        errMsg: req.flash('errMsg')
      });
    } catch (err) {
      console.log(err);
      res.status(500).render('front_view/error');
    }
  },

  search: async function(req, res) {
    try {
      const cmnIns = new CommonService();
      const user_info = await cmnIns.get_loged_in_user_info(req);
      const service = new StudentPhotoService();
      if (!service.canView(user_info)) return jsonError(res, 403, 'You do not have permission to manage student photos.');
      const result = await service.search(req.query.q || req.body.q || '');
      res.status(result.status ? 200 : 422).json(Object.assign({ success: result.status }, result));
    } catch (err) {
      console.log(err);
      jsonError(res, 500, 'Server error.');
    }
  },

  show: async function(req, res) {
    try {
      const cmnIns = new CommonService();
      const user_info = await cmnIns.get_loged_in_user_info(req);
      const service = new StudentPhotoService();
      if (!service.canView(user_info)) return jsonError(res, 403, 'You do not have permission to manage student photos.');
      const result = await service.getStudent(req.params.id);
      res.status(result.status ? 200 : 404).json(Object.assign({ success: result.status }, result));
    } catch (err) {
      console.log(err);
      jsonError(res, 500, 'Server error.');
    }
  },

  upload: async function(req, res) {
    try {
      const cmnIns = new CommonService();
      const user_info = await cmnIns.get_loged_in_user_info(req);
      const service = new StudentPhotoService();
      if (!service.canUpload(user_info)) return jsonError(res, 403, 'You do not have permission to manage student photos.');
      const student = await service.getStudent(req.params.id);
      if (!student.status) return jsonError(res, 404, 'Student record was not found.');
      const file = await service.parseMultipart(req);
      const result = await service.savePhoto(student.result, file, user_info, req.ip);
      res.status(result.status ? 200 : 422).json(Object.assign({ success: result.status, message: result.sucMsg || result.errMsg }, result));
    } catch (err) {
      console.log(err.message || err);
      jsonError(res, err.message && err.message.indexOf('2 MB') >= 0 ? 422 : 400, err.message || 'Please select a valid image file.');
    }
  },

  remove: async function(req, res) {
    try {
      const cmnIns = new CommonService();
      const user_info = await cmnIns.get_loged_in_user_info(req);
      const service = new StudentPhotoService();
      if (!service.canDelete(user_info)) return jsonError(res, 403, 'You do not have permission to manage student photos.');
      const student = await service.getStudent(req.params.id);
      if (!student.status) return jsonError(res, 404, 'Student record was not found.');
      const result = await service.removePhoto(student.result, user_info, req.ip);
      res.status(result.status ? 200 : 422).json(Object.assign({ success: result.status, message: result.sucMsg || result.errMsg }, result));
    } catch (err) {
      console.log(err);
      jsonError(res, 500, 'Server error.');
    }
  }
};
