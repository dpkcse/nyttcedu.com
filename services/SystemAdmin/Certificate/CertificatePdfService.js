const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const CertificateQrService = require('./CertificateQrService');

const TEMPLATE_PATH = process.env.CERTIFICATE_TEMPLATE_PATH || path.join(process.cwd(), 'public', 'uploads', 'certificates', 'templates', 'blank-certificate.pdf');
const GENERATED_DIR = path.join(process.cwd(), 'public', 'uploads', 'certificates', 'generated');
const PUBLIC_GENERATED_DIR = '/uploads/certificates/generated';

const BASE_LAYOUT_SIZE = { width: 1100, height: 520 };

const CERTIFICATE_TEXT_LAYOUT = {
  serialValue: { x: 145, y: 410, size: 12 },

  regLabel: { x: 700, y: 390, size: 12 },
  regValue: { x: 770, y: 390, size: 12, maxWidth: 180 },
  sessionLabel: { x: 700, y: 365, size: 12 },
  sessionValue: { x: 770, y: 365, size: 12, maxWidth: 245 },

  line1Label: { x: 250, y: 315, size: 14 },
  studentName: { x: 410, y: 315, size: 14, maxWidth: 500 },

  line2Label: { x: 250, y: 285, size: 14 },
  fatherName: { x: 395, y: 285, size: 14, maxWidth: 520 },
  fatherTag: { x: 950, y: 285, size: 13 },

  line3Label: { x: 250, y: 255, size: 14 },
  motherName: { x: 395, y: 255, size: 14, maxWidth: 520 },
  motherTag: { x: 950, y: 255, size: 13 },

  line4Label: { x: 250, y: 225, size: 14 },
  instituteName: { x: 395, y: 225, size: 14, maxWidth: 560 },

  rollLabel: { x: 250, y: 190, size: 14 },
  rollValue: { x: 365, y: 190, size: 14, maxWidth: 115 },
  durationText: { x: 485, y: 190, size: 14 },
  courseTitle: { x: 690, y: 190, size: 14, maxWidth: 330 },

  examLabel: { x: 250, y: 160, size: 14 },
  examMonth: { x: 590, y: 160, size: 14, maxWidth: 125 },
  resultLabel: { x: 735, y: 160, size: 14 },
  resultValue: { x: 945, y: 160, size: 14, maxWidth: 80 },

  scaleLine: { x: 250, y: 130, size: 13, maxWidth: 760 },

  passportLabel: { x: 250, y: 100, size: 13 },
  passportValue: { x: 720, y: 100, size: 13, maxWidth: 240 },

  issueDateLabel: { x: 85, y: 65, size: 12 },
  issueDateValue: { x: 165, y: 65, size: 12, maxWidth: 190 },

  qrCode: { x: 520, y: 45, width: 85, height: 85 },
};

function clean(value) {
  return value === null || value === undefined || String(value).trim() === '' ? 'N/A' : String(value).trim();
}

function layoutScale(page) {
  const { width, height } = page.getSize();
  return { x: width / BASE_LAYOUT_SIZE.width, y: height / BASE_LAYOUT_SIZE.height };
}

function toPoint(page, position) {
  const scale = layoutScale(page);
  return { x: position.x * scale.x, y: position.y * scale.y };
}

function scaledSize(page, position) {
  const scale = layoutScale(page);
  return position.size * Math.min(scale.x, scale.y);
}

function scaledMaxWidth(page, position, fallback) {
  const scale = layoutScale(page);
  return position.maxWidth ? position.maxWidth * scale.x : fallback;
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
  const maxWidth = scaledMaxWidth(page, position, options.maxWidth);
  let size = scaledSize(page, position);
  let fitted = clean(text);
  while (maxWidth && size > 10 && font.widthOfTextAtSize(fitted, size) > maxWidth) size -= 0.5;
  fitted = truncateText(fitted, font, size, maxWidth);
  page.drawText(fitted, {
    ...toPoint(page, position),
    size,
    font,
    color: rgb(0, 0, 0),
    maxWidth,
  });
}

function getLandscapePageSize(embeddedPage) {
  const width = Math.max(embeddedPage.width, embeddedPage.height);
  const height = Math.min(embeddedPage.width, embeddedPage.height);
  return { width, height };
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
    const pdfDoc = await PDFDocument.create();
    const [templatePage] = await pdfDoc.embedPdf(templateBytes, [0]);
    const pageSize = getLandscapePageSize(templatePage);
    const page = pdfDoc.addPage([pageSize.width, pageSize.height]);
    page.drawPage(templatePage, { x: 0, y: 0, width: pageSize.width, height: pageSize.height });

    const bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const valueFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

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
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.durationText, `duly passed the ${clean(certificate.course_duration)}`);
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.courseTitle, certificate.course_title);

    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.examLabel, 'Course Examination held in the month of');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.examMonth, certificate.exam_month || certificate.passing_year);
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.resultLabel, 'and he/she secured CGPA');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.resultValue, certificate.result);
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.scaleLine, 'On the scale of 4.00 at Under the "Education Program" National Youth Technical Training Center');
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.passportLabel, 'His/Her Passport Number as recorded in his/her registration book is');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.passportValue, certificate.passport_no);
    drawTextFit(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.issueDateLabel, 'Issue Date:');
    drawTextFit(page, valueFont, CERTIFICATE_TEXT_LAYOUT.issueDateValue, certificate.issue_date || new Date().toISOString().slice(0, 10));

    const qrBytes = await fs.promises.readFile(qr.absolutePath);
    const qrImage = await pdfDoc.embedPng(qrBytes);
    const qrLayout = CERTIFICATE_TEXT_LAYOUT.qrCode;
    const scale = layoutScale(page);
    const qrWidth = qrLayout.width * Math.min(scale.x, scale.y);
    const qrHeight = qrLayout.height * Math.min(scale.x, scale.y);
    page.drawImage(qrImage, {
      x: (page.getWidth() - qrWidth) / 2,
      y: qrLayout.y * scale.y,
      width: qrWidth,
      height: qrHeight,
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
