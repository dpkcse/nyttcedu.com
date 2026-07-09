const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const CertificateQrService = require('./CertificateQrService');

const TEMPLATE_PATH = process.env.CERTIFICATE_TEMPLATE_PATH || path.join(process.cwd(), 'public', 'uploads', 'certificates', 'templates', 'blank-certificate.pdf');
const GENERATED_DIR = path.join(process.cwd(), 'public', 'uploads', 'certificates', 'generated');
const PUBLIC_GENERATED_DIR = '/uploads/certificates/generated';

const BASE_LAYOUT_SIZE = { width: 1100, height: 520 };

const CERTIFICATE_FONT_SIZES = {
  serial: 15,
  regSession: 15,
  label: 16,
  value: 16,
  studentName: 18,
  bodyLine: 16,
  smallLine: 15,
  issueDate: 15,
};

const CERTIFICATE_TEXT_LAYOUT = {
  // Template already contains the SL No- label; draw only the dynamic number.
  serialValue: { x: 125, y: 405, size: CERTIFICATE_FONT_SIZES.serial, maxWidth: 130, minSize: 12 },

  regLabel: { x: 690, y: 385, size: CERTIFICATE_FONT_SIZES.regSession },
  regValue: { x: 765, y: 385, size: CERTIFICATE_FONT_SIZES.regSession, maxWidth: 220, minSize: 12 },
  sessionLabel: { x: 690, y: 360, size: CERTIFICATE_FONT_SIZES.regSession },
  sessionValue: { x: 765, y: 360, size: CERTIFICATE_FONT_SIZES.regSession, maxWidth: 240, minSize: 12 },

  line1: { x: 215, y: 305, size: CERTIFICATE_FONT_SIZES.bodyLine, maxWidth: 760, minSize: 13 },
  studentName: { size: CERTIFICATE_FONT_SIZES.studentName, maxWidth: 360, minSize: 14 },

  line2Label: { x: 215, y: 270, size: CERTIFICATE_FONT_SIZES.bodyLine },
  fatherName: { x: 385, y: 270, size: CERTIFICATE_FONT_SIZES.bodyLine, maxWidth: 430, minSize: 13 },
  fatherTag: { x: 900, y: 270, size: CERTIFICATE_FONT_SIZES.smallLine },

  line3Label: { x: 215, y: 235, size: CERTIFICATE_FONT_SIZES.bodyLine },
  motherName: { x: 385, y: 235, size: CERTIFICATE_FONT_SIZES.bodyLine, maxWidth: 430, minSize: 13 },
  motherTag: { x: 900, y: 235, size: CERTIFICATE_FONT_SIZES.smallLine },

  line4Label: { x: 215, y: 200, size: CERTIFICATE_FONT_SIZES.bodyLine },
  instituteName: { x: 330, y: 200, size: CERTIFICATE_FONT_SIZES.bodyLine, maxWidth: 620, minSize: 13 },

  rollCourseLine: { x: 215, y: 160, size: CERTIFICATE_FONT_SIZES.bodyLine, maxWidth: 760, minSize: 13 },
  examResultLine: { x: 215, y: 125, size: CERTIFICATE_FONT_SIZES.bodyLine, maxWidth: 760, minSize: 13 },
  scaleLine: { x: 215, y: 95, size: CERTIFICATE_FONT_SIZES.smallLine, maxWidth: 760, minSize: 12 },
  passportLine: { x: 215, y: 70, size: CERTIFICATE_FONT_SIZES.smallLine, maxWidth: 520, minSize: 12 },

  issueDateLabel: { x: 85, y: 45, size: CERTIFICATE_FONT_SIZES.issueDate },
  issueDateValue: { x: 175, y: 45, size: CERTIFICATE_FONT_SIZES.issueDate, maxWidth: 190, minSize: 12 },

  qrCode: { x: 520, y: 25, width: 80, height: 80 },
};

function clean(value, fallback = 'N/A') {
  return value === null || value === undefined || String(value).trim() === '' ? fallback : String(value).trim();
}

function cleanOptional(value) {
  return clean(value, '');
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
  const value = clean(text, '');
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
  let fitted = clean(text, '');
  while (maxWidth && fittedSize > minSize && font.widthOfTextAtSize(fitted, fittedSize) > maxWidth) {
    fittedSize -= 0.5;
  }
  fitted = truncateText(fitted, font, fittedSize, maxWidth);
  page.drawText(fitted, { x, y, size: fittedSize, font, color, maxWidth });
}


function drawSegments(page, segments, { x, y, size, maxWidth, minSize = 11, color = rgb(0, 0, 0) }) {
  const segmentWidth = (fontSize) => segments.reduce((width, segment) => (
    width + segment.font.widthOfTextAtSize(clean(segment.text, ''), fontSize)
  ), 0);
  let fittedSize = size;
  while (maxWidth && fittedSize > minSize && segmentWidth(fittedSize) > maxWidth) {
    fittedSize -= 0.5;
  }

  let cursorX = x;
  segments.forEach((segment) => {
    const text = clean(segment.text, '');
    if (!text) return;
    page.drawText(text, { x: cursorX, y, size: fittedSize, font: segment.font, color });
    cursorX += segment.font.widthOfTextAtSize(text, fittedSize);
  });
}

function drawLayoutSegments(page, position, segments) {
  const point = toPoint(page, position);
  const maxWidth = scaledMaxWidth(page, position);
  const size = scaledSize(page, position);
  const scale = layoutScale(page);
  const minSize = (position.minSize || 11) * Math.min(scale.x, scale.y);
  drawSegments(page, segments, { ...point, size, maxWidth, minSize });
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

    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.line1, [
      { text: 'This is to certify that        ', font: bodyFont },
      { text: clean(certificate.s_name), font: valueFont },
    ]);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.line2Label, 'Son/daughter of');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.fatherName, certificate.f_name);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.fatherTag, '(Father)');
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.line3Label, 'and');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.motherName, certificate.m_name);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.motherTag, '(Mother)');
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.line4Label, 'of');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.instituteName, certificate.institute_name || 'National Youth Technical Training Center');

    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.rollCourseLine, [
      { text: 'bearing Roll No. ', font: bodyFont },
      { text: clean(certificate.roll_no || certificate.serial_no), font: valueFont },
      { text: ' duly passed the ', font: bodyFont },
      { text: `${clean(certificate.course_duration)} ${clean(certificate.course_title)}`, font: valueFont },
    ]);
    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.examResultLine, [
      { text: 'Course Examination held in the month of ', font: bodyFont },
      { text: clean(certificate.exam_month || certificate.passing_year), font: valueFont },
      { text: ' and he/she secured CGPA ', font: bodyFont },
      { text: clean(certificate.result), font: valueFont },
    ]);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.scaleLine, 'On the scale of 4.00 at Under the "Education Program" National Youth Technical Training Center');
    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.passportLine, [
      { text: 'His/Her Passport Number as recorded in his/her registration book is ', font: bodyFont },
      { text: cleanOptional(certificate.passport_no) || '........................', font: valueFont },
    ]);
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
