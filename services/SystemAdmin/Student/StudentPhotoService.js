const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const studentPhotoModels = require('../../../models/system_admin/student_photo');

class StudentPhotoService {
  constructor() {
    this.MODELS = studentPhotoModels;
    this.allowed = {
      'image/jpeg': { ext: 'jpg', signatures: [[0xff, 0xd8, 0xff]] },
      'image/png': { ext: 'png', signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
      'image/webp': { ext: 'webp', signatures: [] }
    };
    this.maxSize = 2 * 1024 * 1024;
  }

  canView(user) { return !!user; }
  canUpload(user) { return user && (user.user_type == 1 || user.user_type == 2); }
  canDelete(user) { return this.canUpload(user); }

  photoUrl(relativePath) {
    if (!relativePath) return '';
    return '/' + String(relativePath).replace(/^\/+/, '').replace(/\\/g, '/');
  }

  mapStudent(v) {
    return {
      id: v.id,
      serial_no: v.serial_no,
      registration_no: v.serial_no,
      s_name: v.s_name,
      f_name: v.f_name,
      m_name: v.m_name,
      session: v.session,
      course_title: v.course_title,
      passing_year: v.passing_year,
      result: v.result,
      status: v.is_approved == 1 ? 'Approved' : 'Not Approved',
      photo_path: v.photo_path || '',
      photo_url: this.photoUrl(v.photo_path)
    };
  }

  async search(term) {
    const clean = String(term || '').trim();
    if (!clean) return { status: false, errMsg: 'Search term is required.' };
    if (clean.length < 2) return { status: false, errMsg: 'Please enter at least 2 characters.' };
    const found = await this.MODELS.SearchStudentsModel(clean, 25);
    return { status: true, result: found.result.map(v => this.mapStudent(v)), sucMsg: found.result.length ? 'Students found.' : 'No students found.' };
  }

  async getStudent(studentId) {
    const found = await this.MODELS.GetStudentByIdModel(studentId);
    if (!found.status || found.result.length !== 1) return { status: false, errMsg: 'Student record was not found.' };
    return { status: true, result: this.mapStudent(found.result[0]), raw: found.result[0] };
  }

  parseMultipart(req) {
    return new Promise((resolve, reject) => {
      const contentType = req.headers['content-type'] || '';
      const match = contentType.match(/boundary=(?:(?:"([^"]+)")|([^;]+))/i);
      if (!match) return reject(new Error('Invalid multipart request.'));
      const boundary = Buffer.from('--' + (match[1] || match[2]));
      const chunks = [];
      let size = 0;
      req.on('data', chunk => {
        size += chunk.length;
        if (size > this.maxSize + 1024 * 512) req.destroy(new Error('The selected image must not exceed 2 MB.'));
        else chunks.push(chunk);
      });
      req.on('error', reject);
      req.on('end', () => {
        const body = Buffer.concat(chunks);
        const parts = [];
        let start = body.indexOf(boundary) + boundary.length + 2;
        while (start > boundary.length) {
          const end = body.indexOf(boundary, start);
          if (end < 0) break;
          const part = body.slice(start, end - 2);
          const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
          if (headerEnd > -1) parts.push({ header: part.slice(0, headerEnd).toString(), data: part.slice(headerEnd + 4) });
          start = end + boundary.length + 2;
        }
        const filePart = parts.find(p => /name="photo"/i.test(p.header));
        if (!filePart) return reject(new Error('Please select a valid image file.'));
        const filenameMatch = filePart.header.match(/filename="([^"]*)"/i);
        const typeMatch = filePart.header.match(/Content-Type:\s*([^\r\n]+)/i);
        resolve({ originalName: filenameMatch ? filenameMatch[1] : '', mime: typeMatch ? typeMatch[1].trim().toLowerCase() : '', buffer: filePart.data });
      });
    });
  }

  validateImage(file) {
    if (!file || !file.buffer || file.buffer.length === 0) throw new Error('Please select a valid image file.');
    if (file.buffer.length > this.maxSize) throw new Error('The selected image must not exceed 2 MB.');
    if (!this.allowed[file.mime]) throw new Error('Please select a valid image file.');
    const lower = String(file.originalName || '').toLowerCase();
    if (/\.svg$|\.exe$|\.php$|\.js$|\.sh$/.test(lower)) throw new Error('Please select a valid image file.');
    if (file.mime === 'image/webp') {
      if (file.buffer.slice(0,4).toString() !== 'RIFF' || file.buffer.slice(8,12).toString() !== 'WEBP') throw new Error('Please select a valid image file.');
    } else {
      const sig = this.allowed[file.mime].signatures[0];
      if (!sig.every((b, i) => file.buffer[i] === b)) throw new Error('Please select a valid image file.');
    }
  }

  async savePhoto(student, file, user, ip) {
    this.validateImage(file);
    const ext = this.allowed[file.mime].ext;
    const dirRel = path.posix.join('uploads', 'students', 'photos', String(student.id));
    const fileRel = path.posix.join(dirRel, `student-${student.id}-${crypto.randomUUID()}.${ext}`);
    const fullDir = path.join(process.cwd(), 'public', ...dirRel.split('/'));
    const fullPath = path.join(process.cwd(), 'public', ...fileRel.split('/'));
    fs.mkdirSync(fullDir, { recursive: true });
    fs.writeFileSync(fullPath, file.buffer, { flag: 'wx' });
    try {
      const current = await this.getStudent(student.id);
      if (!current.status) throw new Error(current.errMsg);
      const oldPath = current.result.photo_path || '';
      const updated = await this.MODELS.UpdateStudentPhotoPathModel(student.id, fileRel, user.user_id);
      if (!updated.status || updated.result.affectedRows !== 1) throw new Error('Photo update failed. The existing photo was not changed.');
      await this.MODELS.LogPhotoActivityModel({ student_id: student.id, serial_no: student.serial_no, action_type: oldPath ? 'STUDENT_PHOTO_REPLACED' : 'STUDENT_PHOTO_UPLOADED', old_photo_path: oldPath || null, new_photo_path: fileRel, updated_by: user.user_id, ip_address: ip });
      if (oldPath) this.safeDelete(oldPath);
      return { status: true, sucMsg: oldPath ? 'Student photo updated successfully.' : 'Student photo uploaded successfully.', result: { student_id: student.id, photo_url: this.photoUrl(fileRel) } };
    } catch (err) {
      this.safeDelete(fileRel);
      return { status: false, errMsg: err.message || 'Photo update failed. The existing photo was not changed.' };
    }
  }

  safeDelete(relativePath) {
    try {
      if (!relativePath) return;
      const normalized = String(relativePath).replace(/\\/g, '/').replace(/^\/+/, '');
      if (!normalized.startsWith('uploads/students/photos/')) return;
      const full = path.join(process.cwd(), 'public', ...normalized.split('/'));
      if (fs.existsSync(full)) fs.unlinkSync(full);
    } catch (err) { console.log('Student photo cleanup warning', err.message || err); }
  }

  async removePhoto(student, user, ip) {
    const current = await this.getStudent(student.id);
    if (!current.status) return current;
    const oldPath = current.result.photo_path || '';
    if (!oldPath) return { status: true, sucMsg: 'Student photo removed successfully.' };
    const updated = await this.MODELS.UpdateStudentPhotoPathModel(student.id, null, user.user_id);
    if (!updated.status || updated.result.affectedRows !== 1) return { status: false, errMsg: 'Photo update failed. The existing photo was not changed.' };
    await this.MODELS.LogPhotoActivityModel({ student_id: student.id, serial_no: student.serial_no, action_type: 'STUDENT_PHOTO_REMOVED', old_photo_path: oldPath, new_photo_path: null, updated_by: user.user_id, ip_address: ip });
    this.safeDelete(oldPath);
    return { status: true, sucMsg: 'Student photo removed successfully.' };
  }
}

module.exports = StudentPhotoService;
