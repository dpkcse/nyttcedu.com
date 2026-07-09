const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const CertificateQrService = require('./CertificateQrService');

const TEMPLATE_PATH = process.env.CERTIFICATE_TEMPLATE_PATH || path.join(process.cwd(), 'public', 'uploads', 'certificates', 'templates', 'blank-certificate.pdf');
const GENERATED_DIR = path.join(process.cwd(), 'public', 'uploads', 'certificates', 'generated');
const PUBLIC_GENERATED_DIR = '/uploads/certificates/generated';

const BASE_LAYOUT_SIZE = { width: 1100, height: 520 };

const CERTIFICATE_FONT_SIZES = {
  serial: 14,
  regSession: 14,
  bodyLabel: 15,
  bodyValue: 15,
  studentName: 17,
  parentName: 15,
  instituteName: 15,
  rollCourseLine: 15,
  examResultLine: 15,
  scaleLine: 14,
  passportLine: 14,
  issueDate: 14,
};

const CERTIFICATE_TEXT_LAYOUT = {
  serialValue: { x: 145, y: 410, size: CERTIFICATE_FONT_SIZES.serial, maxWidth: 130, minSize: 12 },

  regLabel: { x: 700, y: 390, size: CERTIFICATE_FONT_SIZES.regSession },
  regValue: { x: 770, y: 390, size: CERTIFICATE_FONT_SIZES.regSession, maxWidth: 190, minSize: 11 },
  sessionLabel: { x: 700, y: 365, size: CERTIFICATE_FONT_SIZES.regSession },
  sessionValue: { x: 770, y: 365, size: CERTIFICATE_FONT_SIZES.regSession, maxWidth: 250, minSize: 11 },

  line1Label: { x: 230, y: 315, size: CERTIFICATE_FONT_SIZES.bodyLabel },
  studentName: { x: 390, y: 315, size: CERTIFICATE_FONT_SIZES.studentName, maxWidth: 570, minSize: 13 },

  line2Label: { x: 230, y: 280, size: CERTIFICATE_FONT_SIZES.bodyLabel },
  fatherName: { x: 365, y: 280, size: CERTIFICATE_FONT_SIZES.parentName, maxWidth: 555, minSize: 12 },
  fatherTag: { x: 930, y: 280, size: CERTIFICATE_FONT_SIZES.bodyLabel },

  line3Label: { x: 230, y: 245, size: CERTIFICATE_FONT_SIZES.bodyLabel },
  motherName: { x: 275, y: 245, size: CERTIFICATE_FONT_SIZES.parentName, maxWidth: 645, minSize: 12 },
  motherTag: { x: 930, y: 245, size: CERTIFICATE_FONT_SIZES.bodyLabel },

  line4Label: { x: 230, y: 210, size: CERTIFICATE_FONT_SIZES.bodyLabel },
  instituteName: { x: 265, y: 210, size: CERTIFICATE_FONT_SIZES.instituteName, maxWidth: 700, minSize: 12 },

  rollLabel: { x: 230, y: 170, size: CERTIFICATE_FONT_SIZES.rollCourseLine },
  rollValue: { x: 345, y: 170, size: CERTIFICATE_FONT_SIZES.rollCourseLine, maxWidth: 105, minSize: 12 },
  durationText: { x: 455, y: 170, size: CERTIFICATE_FONT_SIZES.rollCourseLine, maxWidth: 210, minSize: 12 },
  courseTitle: { x: 665, y: 170, size: CERTIFICATE_FONT_SIZES.rollCourseLine, maxWidth: 350, minSize: 11 },

  examLabel: { x: 230, y: 135, size: CERTIFICATE_FONT_SIZES.examResultLine },
  examMonth: { x: 575, y: 135, size: CERTIFICATE_FONT_SIZES.examResultLine, maxWidth: 145, minSize: 12 },
  resultLabel: { x: 725, y: 135, size: CERTIFICATE_FONT_SIZES.examResultLine },
  resultValue: { x: 930, y: 135, size: CERTIFICATE_FONT_SIZES.examResultLine, maxWidth: 85, minSize: 12 },

  scaleLine: { x: 230, y: 105, size: CERTIFICATE_FONT_SIZES.scaleLine, maxWidth: 790, minSize: 11 },

  passportLabel: { x: 230, y: 80, size: CERTIFICATE_FONT_SIZES.passportLine, maxWidth: 480, minSize: 11 },
  passportValue: { x: 710, y: 80, size: CERTIFICATE_FONT_SIZES.passportLine, maxWidth: 300, minSize: 11 },

  issueDateLabel: { x: 85, y: 50, size: CERTIFICATE_FONT_SIZES.issueDate },
  issueDateValue: { x: 165, y: 50, size: CERTIFICATE_FONT_SIZES.issueDate, maxWidth: 190, minSize: 11 },

  qrCode: { x: 520, y: 35, width: 80, height: 80 },
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

function drawTextFit(page, text, {
  x,
  y,
  maxWidth,
  size,
  minSize = 11,
  font,
  color = rgb(0, 0, 0),
}) {
  let fittedSize = size;
  let fitted = clean(text);
  while (maxWidth && fittedSize > minSize && font.widthOfTextAtSize(fitted, fittedSize) > maxWidth) {
    fittedSize -= 0.5;
  }
  fitted = truncateText(fitted, font, fittedSize, maxWidth);
  page.drawText(fitted, { x, y, size: fittedSize, font, color, maxWidth });
}

function drawLayoutText(page, font, position, text, options = {}) {
  const point = toPoint(page, position);
  const maxWidth = scaledMaxWidth(page, position, options.maxWidth);
  const size = scaledSize(page, position);
  const scale = layoutScale(page);
  const minSize = (position.minSize || options.minSize || 11) * Math.min(scale.x, scale.y);
  drawTextFit(page, text, {
    ...point,
    maxWidth,
    size,
    minSize,
    font,
    color: options.color || rgb(0, 0, 0),
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

    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.serialValue, safeSerial);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.regLabel, 'Reg. No :');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.regValue, certificate.reg_no || certificate.id);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.sessionLabel, 'Session :');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.sessionValue, certificate.session);

    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.line1Label, 'This is to certify that');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.studentName, certificate.s_name);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.line2Label, 'Son/daughter of');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.fatherName, certificate.f_name);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.fatherTag, '(Father)');
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.line3Label, 'and');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.motherName, certificate.m_name);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.motherTag, '(Mother)');
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.line4Label, 'of');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.instituteName, certificate.institute_name || 'National Youth Technical Training Center');

    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.rollLabel, 'bearing Roll No.');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.rollValue, certificate.roll_no || certificate.serial_no);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.durationText, `duly passed the ${clean(certificate.course_duration)}`);
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.courseTitle, certificate.course_title);

    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.examLabel, 'Course Examination held in the month of');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.examMonth, certificate.exam_month || certificate.passing_year);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.resultLabel, 'and he/she secured CGPA');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.resultValue, certificate.result);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.scaleLine, 'On the scale of 4.00 at Under the "Education Program" National Youth Technical Training Center');
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.passportLabel, 'His/Her Passport Number as recorded in his/her registration book is');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.passportValue, certificate.passport_no);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.issueDateLabel, 'Issue Date:');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.issueDateValue, certificate.issue_date || new Date().toISOString().slice(0, 10));

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
