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

const SAFE_AREA = {
  left: 205,
  right: 820,
  top: 315,
  bottom: 85,
};

const CERTIFICATE_TEXT_LAYOUT = {
  // Template already contains the SL No- label; draw only the dynamic number.
  serialValue: { x: 125, y: 405, size: 15, maxWidth: 130, minSize: 12 },

  regLabel: { x: 640, y: 390, size: 14 },
  regValue: { x: 715, y: 390, size: 14, maxWidth: 130, minSize: 12 },

  sessionLabel: { x: 640, y: 365, size: 14 },
  sessionValue: { x: 715, y: 365, size: 14, maxWidth: 170, minSize: 12 },

  line1: { x: 220, y: 310, size: 16, maxWidth: 600, minSize: 13 },
  line2: { x: 220, y: 275, size: 16, maxWidth: 560, minSize: 13 },
  fatherTag: { x: 760, y: 275, size: 14 },

  line3: { x: 220, y: 240, size: 16, maxWidth: 560, minSize: 13 },
  motherTag: { x: 760, y: 240, size: 14 },

  line4: { x: 220, y: 205, size: 16, maxWidth: 600, minSize: 13 },

  rollCourseLine: { x: 220, y: 165, size: 16, maxWidth: 600, minSize: 13 },
  rollCourseLine2: { x: 220, y: 140, size: 16, maxWidth: 600, minSize: 13 },

  examResultLine: { x: 220, y: 115, size: 15, maxWidth: 600, minSize: 12 },

  scaleLine: { x: 220, y: 90, size: 13.5, maxWidth: 600, minSize: 11 },

  passportLine: { x: 220, y: 68, size: 13.5, maxWidth: 450, minSize: 11 },

  issueDate: { x: 85, y: 45, size: 14, maxWidth: 220, minSize: 12 },

  qrCode: { x: 520, y: 10, width: 70, height: 70 },
};

function cleanValue(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  if (!text) return fallback;
  if (['n/a', 'undefined', 'null'].includes(text.toLowerCase())) return fallback;
  return text;
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
  const value = cleanValue(text, '');
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
  let fitted = cleanValue(text, '');
  while (maxWidth && fittedSize > minSize && font.widthOfTextAtSize(fitted, fittedSize) > maxWidth) {
    fittedSize -= 0.5;
  }
  fitted = truncateText(fitted, font, fittedSize, maxWidth);
  page.drawText(fitted, { x, y, size: fittedSize, font, color, maxWidth });
}


function segmentText(segment) {
  return segment.isValue ? cleanValue(segment.text, '') : String(segment.text || '');
}

function drawSegmentsFit(page, segments, { x, y, size, minSize = 11, maxWidth, color = rgb(0, 0, 0) }) {
  const segmentWidth = (fontSize) => segments.reduce((width, segment) => (
    width + segment.font.widthOfTextAtSize(segmentText(segment), segment.size ? fontSize * (segment.size / size) : fontSize)
  ), 0);
  let fittedSize = size;
  while (maxWidth && fittedSize > minSize && segmentWidth(fittedSize) > maxWidth) {
    fittedSize -= 0.5;
  }

  let cursorX = x;
  segments.forEach((segment) => {
    const text = segmentText(segment);
    if (!text) return;
    const segmentSize = segment.size ? fittedSize * (segment.size / size) : fittedSize;
    page.drawText(text, { x: cursorX, y, size: segmentSize, font: segment.font, color });
    cursorX += segment.font.widthOfTextAtSize(text, segmentSize);
  });
}

function drawSegments(page, segments, options) {
  drawSegmentsFit(page, segments, options);
}

function drawLayoutSegments(page, position, segments) {
  const point = toPoint(page, position);
  const maxWidth = scaledMaxWidth(page, position, Math.max(0, SAFE_AREA.right - position.x));
  const size = scaledSize(page, position);
  const scale = layoutScale(page);
  const minSize = (position.minSize || 11) * Math.min(scale.x, scale.y);
  const scaledSegments = segments.map((segment) => ({
    ...segment,
    size: segment.size ? segment.size * Math.min(scale.x, scale.y) : undefined,
  }));
  drawSegments(page, scaledSegments, { ...point, size, maxWidth, minSize });
}

function drawLayoutText(page, font, position, text, options = {}) {
  const point = toPoint(page, position);
  const maxWidth = scaledMaxWidth(page, position, options.maxWidth || Math.max(0, SAFE_AREA.right - position.x));
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

function drawCourseLine(page, bodyFont, valueFont, rollNo, courseDisplay) {
  const firstLine = CERTIFICATE_TEXT_LAYOUT.rollCourseLine;
  const maxWidth = firstLine.maxWidth || SAFE_AREA.right - firstLine.x;
  const firstLineSegments = [
    { text: 'bearing Roll No. ', font: bodyFont },
    { text: rollNo, font: valueFont, isValue: true },
    { text: ' duly passed the ', font: bodyFont },
    { text: courseDisplay, font: valueFont, isValue: true },
  ];
  const firstLineWidth = firstLineSegments.reduce((width, segment) => (
    width + segment.font.widthOfTextAtSize(segmentText(segment), firstLine.size)
  ), 0);

  if (firstLineWidth <= maxWidth) {
    drawLayoutSegments(page, firstLine, firstLineSegments);
    return;
  }

  drawLayoutSegments(page, firstLine, [
    { text: 'bearing Roll No. ', font: bodyFont },
    { text: rollNo, font: valueFont, isValue: true },
    { text: ' duly passed the', font: bodyFont },
  ]);
  drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.rollCourseLine2, courseDisplay);
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
    const studentName = cleanValue(certificate.s_name);
    const fatherName = cleanValue(certificate.f_name);
    const motherName = cleanValue(certificate.m_name);
    const instituteName = cleanValue(certificate.institute_name, 'National Youth Technical Training Center');
    const rollNo = cleanValue(certificate.roll_no || certificate.serial_no);
    const courseDuration = cleanValue(certificate.course_duration);
    const courseTitle = cleanValue(certificate.course_title);
    let courseDisplay = courseTitle;
    if (courseDuration && courseTitle && !courseTitle.toLowerCase().includes(courseDuration.toLowerCase())) {
      courseDisplay = `${courseDuration} ${courseTitle}`;
    }
    const examMonth = cleanValue(certificate.exam_month);
    const passingYear = cleanValue(certificate.passing_year);
    const examPeriod = examMonth || passingYear;
    const examPeriodLabel = examMonth ? 'month of ' : 'year ';
    const result = cleanValue(certificate.result);
    const resultLabel = /^[0-9.]+$/.test(result) ? 'CGPA' : 'Grade';
    const passportNo = cleanValue(certificate.passport_no, '........................');

    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.serialValue, safeSerial);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.regLabel, 'Reg. No :');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.regValue, cleanValue(certificate.reg_no || certificate.id));
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.sessionLabel, 'Session :');
    drawLayoutText(page, valueFont, CERTIFICATE_TEXT_LAYOUT.sessionValue, cleanValue(certificate.session));

    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.line1, [
      { text: 'This is to certify that ', font: bodyFont },
      { text: studentName, font: valueFont, size: CERTIFICATE_FONT_SIZES.studentName, isValue: true },
    ]);
    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.line2, [
      { text: 'Son/daughter of ', font: bodyFont },
      { text: fatherName, font: valueFont, isValue: true },
    ]);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.fatherTag, '(Father)');
    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.line3, [
      { text: 'and ', font: bodyFont },
      { text: motherName, font: valueFont, isValue: true },
    ]);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.motherTag, '(Mother)');
    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.line4, [
      { text: 'of ', font: bodyFont },
      { text: instituteName, font: valueFont, isValue: true },
    ]);

    drawCourseLine(page, bodyFont, valueFont, rollNo, courseDisplay);
    const resultSuffix = result ? ` and he/she secured ${resultLabel} ` : '';
    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.examResultLine, [
      { text: `Course Examination held in the ${examPeriodLabel}`, font: bodyFont },
      { text: examPeriod, font: valueFont, isValue: true },
      { text: resultSuffix, font: bodyFont },
      { text: result, font: valueFont, isValue: true },
    ]);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.scaleLine, 'On the scale of 4.00 at Under the "Education Program" National Youth Technical Training Center');
    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.passportLine, [
      { text: 'His/Her Passport Number as recorded in his/her registration book is ', font: bodyFont },
      { text: passportNo, font: valueFont, isValue: true },
    ]);
    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.issueDate, [
      { text: 'Issue Date: ', font: bodyFont },
      { text: cleanValue(certificate.issue_date, new Date().toISOString().slice(0, 10)), font: valueFont, isValue: true },
    ]);

    const qrBytes = await fs.promises.readFile(qr.absolutePath);
    const qrImage = await pdfDoc.embedPng(qrBytes);
    const qrLayout = CERTIFICATE_TEXT_LAYOUT.qrCode;
    const scale = layoutScale(page);
    const qrWidth = qrLayout.width * Math.min(scale.x, scale.y);
    const qrHeight = qrLayout.height * Math.min(scale.x, scale.y);
    page.drawImage(qrImage, {
      x: qrLayout.x * scale.x,
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
