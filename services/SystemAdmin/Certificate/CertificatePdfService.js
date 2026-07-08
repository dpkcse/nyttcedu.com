const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const CertificateQrService = require('./CertificateQrService');

const TEMPLATE_PATH = process.env.CERTIFICATE_TEMPLATE_PATH || path.join(process.cwd(), 'public', 'uploads', 'certificates', 'templates', 'blank-certificate.pdf');
const GENERATED_DIR = path.join(process.cwd(), 'public', 'uploads', 'certificates', 'generated');
const PUBLIC_GENERATED_DIR = '/uploads/certificates/generated';

const CERTIFICATE_POSITIONS = {
  serialNo: { xRatio: 0.70, yRatio: 0.90, size: 12 },
  regNo: { xRatio: 0.16, yRatio: 0.84, size: 11 },
  session: { xRatio: 0.74, yRatio: 0.84, size: 11 },
  studentName: { xRatio: 0.30, yRatio: 0.67, size: 16 },
  fatherName: { xRatio: 0.30, yRatio: 0.61, size: 12 },
  motherName: { xRatio: 0.30, yRatio: 0.56, size: 12 },
  instituteName: { xRatio: 0.30, yRatio: 0.51, size: 12 },
  rollNo: { xRatio: 0.22, yRatio: 0.45, size: 12 },
  courseName: { xRatio: 0.46, yRatio: 0.45, size: 12, maxWidthRatio: 0.42 },
  courseDuration: { xRatio: 0.30, yRatio: 0.40, size: 12 },
  examMonth: { xRatio: 0.46, yRatio: 0.40, size: 12 },
  cgpa: { xRatio: 0.78, yRatio: 0.40, size: 12 },
  passportNo: { xRatio: 0.54, yRatio: 0.33, size: 11 },
  issueDate: { xRatio: 0.18, yRatio: 0.13, size: 11 },
  qrCode: { xRatio: 0.46, yRatio: 0.08, width: 70, height: 70 },
};

function clean(value) {
  return value === null || value === undefined || value === '' ? 'N/A' : String(value).trim();
}

function drawText(page, font, position, label, value) {
  const { width, height } = page.getSize();
  page.drawText(`${label}${clean(value)}`, {
    x: position.xRatio * width,
    y: position.yRatio * height,
    size: position.size,
    font,
    color: rgb(0.08, 0.08, 0.08),
    maxWidth: position.maxWidthRatio ? position.maxWidthRatio * width : undefined,
  });
}

class CertificatePdfService {
  static async generate(certificate) {
    const safeSerial = String(certificate.serial_no || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeSerial) {
      throw new Error('Invalid certificate serial number for PDF generation.');
    }
    if (!fs.existsSync(TEMPLATE_PATH)) {
      throw new Error(`Certificate template PDF not found. Upload it to ${TEMPLATE_PATH} or set CERTIFICATE_TEMPLATE_PATH.`);
    }

    await fs.promises.mkdir(GENERATED_DIR, { recursive: true });
    const qr = await CertificateQrService.generate(safeSerial);
    const templateBytes = await fs.promises.readFile(TEMPLATE_PATH);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    drawText(page, boldFont, CERTIFICATE_POSITIONS.serialNo, 'SL No: ', safeSerial);
    drawText(page, font, CERTIFICATE_POSITIONS.regNo, 'Reg No: ', certificate.reg_no || certificate.id);
    drawText(page, font, CERTIFICATE_POSITIONS.session, 'Session: ', certificate.session);
    drawText(page, boldFont, CERTIFICATE_POSITIONS.studentName, '', certificate.s_name);
    drawText(page, font, CERTIFICATE_POSITIONS.fatherName, 'Father: ', certificate.f_name);
    drawText(page, font, CERTIFICATE_POSITIONS.motherName, 'Mother: ', certificate.m_name);
    drawText(page, font, CERTIFICATE_POSITIONS.instituteName, 'Institute: ', certificate.institute_name || 'National Youth & Technical Training Center');
    drawText(page, font, CERTIFICATE_POSITIONS.rollNo, 'Roll: ', certificate.roll_no || certificate.serial_no);
    drawText(page, font, CERTIFICATE_POSITIONS.courseName, 'Course: ', certificate.course_title);
    drawText(page, font, CERTIFICATE_POSITIONS.courseDuration, 'Duration: ', certificate.course_duration);
    drawText(page, font, CERTIFICATE_POSITIONS.examMonth, 'Passing: ', certificate.exam_month || certificate.passing_year);
    drawText(page, boldFont, CERTIFICATE_POSITIONS.cgpa, 'Result: ', certificate.result);
    if (certificate.passport_no) {
      drawText(page, font, CERTIFICATE_POSITIONS.passportNo, 'Passport No: ', certificate.passport_no);
    }
    drawText(page, font, CERTIFICATE_POSITIONS.issueDate, 'Issue Date: ', certificate.issue_date || new Date().toISOString().slice(0, 10));

    const qrBytes = await fs.promises.readFile(qr.absolutePath);
    const qrImage = await pdfDoc.embedPng(qrBytes);
    const { width, height } = page.getSize();
    page.drawImage(qrImage, {
      x: CERTIFICATE_POSITIONS.qrCode.xRatio * width,
      y: CERTIFICATE_POSITIONS.qrCode.yRatio * height,
      width: CERTIFICATE_POSITIONS.qrCode.width,
      height: CERTIFICATE_POSITIONS.qrCode.height,
    });

    const fileName = `certificate-${safeSerial}.pdf`;
    const absolutePath = path.join(GENERATED_DIR, fileName);
    const publicPath = `${PUBLIC_GENERATED_DIR}/${fileName}`;
    const pdfBytes = await pdfDoc.save();
    await fs.promises.writeFile(absolutePath, pdfBytes);

    return { absolutePath, publicPath, qrCodePath: qr.publicPath, verificationUrl: qr.verificationUrl };
  }
}

module.exports = CertificatePdfService;
