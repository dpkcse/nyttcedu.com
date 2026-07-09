const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const CertificateQrService = require('./CertificateQrService');

const TEMPLATE_PATH = process.env.CERTIFICATE_TEMPLATE_PATH || path.join(process.cwd(), 'public', 'uploads', 'certificates', 'templates', 'blank-certificate.pdf');
const GENERATED_DIR = path.join(process.cwd(), 'public', 'uploads', 'certificates', 'generated');
const PUBLIC_GENERATED_DIR = '/uploads/certificates/generated';

const CERTIFICATE_TEXT_LAYOUT = {
  serialValue: { xRatio: 0.145, yRatio: 0.795, size: 12 },
  regLabel: { xRatio: 0.675, yRatio: 0.785, size: 12 },
  regValue: { xRatio: 0.755, yRatio: 0.785, size: 12 },
  sessionLabel: { xRatio: 0.675, yRatio: 0.750, size: 12 },
  sessionValue: { xRatio: 0.755, yRatio: 0.750, size: 12, maxWidthRatio: 0.22 },

  line1Label: { xRatio: 0.225, yRatio: 0.635, size: 14 },
  studentName: { xRatio: 0.395, yRatio: 0.635, size: 15, maxWidthRatio: 0.46 },
  line2Label: { xRatio: 0.225, yRatio: 0.585, size: 14 },
  fatherName: { xRatio: 0.365, yRatio: 0.585, size: 14, maxWidthRatio: 0.46 },
  fatherTag: { xRatio: 0.820, yRatio: 0.585, size: 13 },
  line3Label: { xRatio: 0.225, yRatio: 0.535, size: 14 },
  motherName: { xRatio: 0.285, yRatio: 0.535, size: 14, maxWidthRatio: 0.54 },
  motherTag: { xRatio: 0.820, yRatio: 0.535, size: 13 },
  line4Label: { xRatio: 0.225, yRatio: 0.485, size: 14 },
  instituteName: { xRatio: 0.260, yRatio: 0.485, size: 14, maxWidthRatio: 0.64 },

  rollLabel: { xRatio: 0.225, yRatio: 0.425, size: 14 },
  rollValue: { xRatio: 0.345, yRatio: 0.425, size: 14, maxWidthRatio: 0.10 },
  passedText: { xRatio: 0.455, yRatio: 0.425, size: 14 },
  courseTitle: { xRatio: 0.640, yRatio: 0.425, size: 14, maxWidthRatio: 0.26 },

  examLabel: { xRatio: 0.225, yRatio: 0.375, size: 14 },
  examMonth: { xRatio: 0.520, yRatio: 0.375, size: 14, maxWidthRatio: 0.14 },
  resultLabel: { xRatio: 0.650, yRatio: 0.375, size: 14 },
  resultValue: { xRatio: 0.855, yRatio: 0.375, size: 14, maxWidthRatio: 0.08 },

  scaleLine: { xRatio: 0.225, yRatio: 0.325, size: 13, maxWidthRatio: 0.68 },
  passportLabel: { xRatio: 0.225, yRatio: 0.275, size: 13 },
  passportValue: { xRatio: 0.675, yRatio: 0.275, size: 13, maxWidthRatio: 0.22 },
  issueDateLabel: { xRatio: 0.095, yRatio: 0.125, size: 12 },
  issueDateValue: { xRatio: 0.190, yRatio: 0.125, size: 12, maxWidthRatio: 0.18 },
  qrCode: { xRatio: 0.466, yRatio: 0.090, width: 80, height: 80 },
};

const DOTTED_LINES = [
  { x1Ratio: 0.390, yRatio: 0.628, x2Ratio: 0.845 },
  { x1Ratio: 0.360, yRatio: 0.578, x2Ratio: 0.805 },
  { x1Ratio: 0.280, yRatio: 0.528, x2Ratio: 0.805 },
  { x1Ratio: 0.255, yRatio: 0.478, x2Ratio: 0.900 },
  { x1Ratio: 0.340, yRatio: 0.418, x2Ratio: 0.905 },
  { x1Ratio: 0.515, yRatio: 0.368, x2Ratio: 0.905 },
  { x1Ratio: 0.670, yRatio: 0.268, x2Ratio: 0.905 },
];

function clean(value) {
  return value === null || value === undefined || String(value).trim() === '' ? 'N/A' : String(value).trim();
}

function toPoint(page, position) {
  const { width, height } = page.getSize();
  return { x: position.xRatio * width, y: position.yRatio * height };
}

function truncateText(text, font, size, maxWidth) {
  const value = clean(text);
  if (!maxWidth || font.widthOfTextAtSize(value, size) <= maxWidth) return value;
  let truncated = value;
  while (truncated.length > 3 && font.widthOfTextAtSize(`${truncated}...`, size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated.trim()}...`;
}

function drawTextFit(page, font, position, text, options = {}) {
  const { width } = page.getSize();
  const maxWidth = position.maxWidthRatio ? position.maxWidthRatio * width : options.maxWidth;
  let size = position.size;
  let fitted = clean(text);
  while (maxWidth && size > 10 && font.widthOfTextAtSize(fitted, size) > maxWidth) size -= 0.5;
  fitted = truncateText(fitted, font, size, maxWidth);
  page.drawText(fitted, {
    ...toPoint(page, position),
    size,
    font,
    color: rgb(0.08, 0.08, 0.08),
    maxWidth,
  });
}

function drawDottedLines(page) {
  const { width, height } = page.getSize();
  DOTTED_LINES.forEach((line) => {
    page.drawLine({
      start: { x: line.x1Ratio * width, y: line.yRatio * height },
      end: { x: line.x2Ratio * width, y: line.yRatio * height },
      thickness: 0.6,
      color: rgb(0.18, 0.18, 0.18),
      dashArray: [1, 3],
      dashPhase: 0,
    });
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
    const bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const valueFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

    drawDottedLines(page);

    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.serialValue, safeSerial);
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.regLabel, 'Reg. No :');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.regValue, certificate.reg_no || certificate.id);
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.sessionLabel, 'Session :');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.sessionValue, certificate.session);

    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.line1Label, 'This is to certify that');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.studentName, certificate.s_name);
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.line2Label, 'Son/daughter of');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.fatherName, certificate.f_name);
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.fatherTag, '(Father)');
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.line3Label, 'and');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.motherName, certificate.m_name);
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.motherTag, '(Mother)');
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.line4Label, 'of');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.instituteName, certificate.institute_name || 'National Youth Technical Training Center');

    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.rollLabel, 'bearing Roll No.');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.rollValue, certificate.roll_no || certificate.serial_no);
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.passedText, `duly passed the ${clean(certificate.course_duration)}`);
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.courseTitle, certificate.course_title);

    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.examLabel, 'Course Examination held in the month of');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.examMonth, certificate.exam_month || certificate.passing_year);
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.resultLabel, 'and he/she secured CGPA');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.resultValue, certificate.result);
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.scaleLine, 'On the scale of 4.00 at Under the "Education Program" National Youth Technical Training Center');
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.passportLabel, 'His/Her Passport Number as recorded in his/her registration book is');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.passportValue, certificate.passport_no);
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.issueDateLabel, 'Issue Date:');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.issueDateValue, certificate.issue_date || new Date().toISOString().slice(0, 10));

    const qrBytes = await fs.promises.readFile(qr.absolutePath);
    const qrImage = await pdfDoc.embedPng(qrBytes);
    const qrPos = toPoint(page, CERTIFICATE_TEXT_LAYOUT.qrCode);
    page.drawImage(qrImage, {
      x: qrPos.x,
      y: qrPos.y,
      width: CERTIFICATE_TEXT_LAYOUT.qrCode.width,
      height: CERTIFICATE_TEXT_LAYOUT.qrCode.height,
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
