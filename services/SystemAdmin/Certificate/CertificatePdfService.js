const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const CertificateQrService = require('./CertificateQrService');

const TEMPLATE_IMAGE_PATH = process.env.CERTIFICATE_TEMPLATE_IMAGE_PATH || path.join(process.cwd(), 'public', 'uploads', 'certificates', 'templates', 'blank-certificate.png');
const TEMPLATE_IMAGE_MISSING_MESSAGE = 'Certificate PNG template not found. Please upload blank-certificate.png to public/uploads/certificates/templates/';
const GENERATED_DIR = path.join(process.cwd(), 'public', 'uploads', 'certificates', 'generated');
const PUBLIC_GENERATED_DIR = '/uploads/certificates/generated';

const PAGE = {
  width: 841.89,
  height: 595.28,
};

const CERTIFICATE_FONT_SIZES = {
  serial: 12,
  regSession: 12,
  body: 13.5,
  value: 13.5,
  studentName: 15,
  small: 12.5,
  issueDate: 12.5,
};

const SAFE_AREA = {
  left: 190,
  right: 720,
  top: 350,
  bottom: 95,
};

const CERTIFICATE_TEXT_LAYOUT = {
  serial: { x: 120, y: 425, size: 12, maxWidth: 170 },

  regLabel: { x: 560, y: 410, size: 12 },
  regValue: { x: 625, y: 410, size: 12, maxWidth: 160 },
  sessionLabel: { x: 560, y: 390, size: 12 },
  sessionValue: { x: 625, y: 390, size: 12, maxWidth: 160 },

  line1: { x: 200, y: 335, size: 13.5, maxWidth: 520 },
  line2: { x: 200, y: 305, size: 13.5, maxWidth: 495 },
  fatherTag: { x: 700, y: 305, size: 12 },

  line3: { x: 200, y: 275, size: 13.5, maxWidth: 495 },
  motherTag: { x: 700, y: 275, size: 12 },

  line4: { x: 200, y: 245, size: 13.5, maxWidth: 540 },

  rollCourseLine: { x: 200, y: 205, size: 13.5, maxWidth: 560 },
  rollCourseLine2: { x: 200, y: 185, size: 13.5, maxWidth: 560 },

  examResultLine: { x: 200, y: 155, size: 13.2, maxWidth: 560 },

  scaleLine: { x: 200, y: 125, size: 12.5, maxWidth: 560 },

  passportLine: { x: 200, y: 100, size: 12.5, maxWidth: 430 },

  issueDate: { x: 75, y: 70, size: 12.5, maxWidth: 180 },

  qrCode: { x: 390, y: 55, width: 70, height: 70 },
};

function cleanValue(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  if (!text) return fallback;
  if (['n/a', 'undefined', 'null'].includes(text.toLowerCase())) return fallback;
  return text;
}

function formatCertificateDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanValue(value);

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
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

function drawLayoutSegments(page, position, segments) {
  const maxWidth = position.maxWidth || Math.max(0, SAFE_AREA.right - position.x);
  drawSegmentsFit(page, segments, { ...position, maxWidth });
}

function drawLayoutText(page, font, position, text, options = {}) {
  const maxWidth = position.maxWidth || options.maxWidth || Math.max(0, SAFE_AREA.right - position.x);
  drawTextFit(page, text, {
    ...position,
    maxWidth,
    minSize: position.minSize || options.minSize || 11,
    font,
    color: options.color || rgb(0, 0, 0),
  });
}

function drawImageCover(page, image, pageWidth, pageHeight) {
  const imageRatio = image.width / image.height;
  const pageRatio = pageWidth / pageHeight;

  let drawWidth = pageWidth;
  let drawHeight = pageHeight;
  let x = 0;
  let y = 0;

  if (Math.abs(imageRatio - pageRatio) > 0.01) {
    if (imageRatio > pageRatio) {
      drawHeight = pageHeight;
      drawWidth = pageHeight * imageRatio;
      x = (pageWidth - drawWidth) / 2;
    } else {
      drawWidth = pageWidth;
      drawHeight = pageWidth / imageRatio;
      y = (pageHeight - drawHeight) / 2;
    }
  }

  page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });
}

function getResultSegments(result, bodyFont, valueFont) {
  if (!result) return [];
  const resultLabel = /^[0-9]+(\.[0-9]+)?$/.test(result) ? 'CGPA' : 'Grade';
  return [
    { text: ` and he/she secured ${resultLabel} `, font: bodyFont },
    { text: result, font: valueFont, isValue: true },
  ];
}

function buildCourseDisplay(courseDuration, courseTitle) {
  if (courseDuration && courseTitle) return `${courseDuration} ${courseTitle}`;
  return courseTitle || courseDuration;
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

class CertificatePdfService {
  static async generate(certificate) {
    const safeSerial = String(certificate.serial_no || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeSerial) {
      throw new Error('Invalid certificate serial number for PDF generation.');
    }
    if (!fs.existsSync(TEMPLATE_IMAGE_PATH)) {
      throw new Error(TEMPLATE_IMAGE_MISSING_MESSAGE);
    }

    await fs.promises.mkdir(GENERATED_DIR, { recursive: true });
    const qr = await CertificateQrService.generate(safeSerial);
    const templateImageBytes = await fs.promises.readFile(TEMPLATE_IMAGE_PATH);
    const pdfDoc = await PDFDocument.create();
    const templateImage = await pdfDoc.embedPng(templateImageBytes);
    const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
    drawImageCover(page, templateImage, PAGE.width, PAGE.height);

    const bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const valueFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
    const studentName = cleanValue(certificate.s_name);
    const fatherName = cleanValue(certificate.f_name);
    const motherName = cleanValue(certificate.m_name);
    const instituteName = cleanValue(certificate.institute_name, 'National Youth Technical Training Center');
    const rollNo = cleanValue(certificate.roll_no || certificate.serial_no);
    const courseDuration = cleanValue(certificate.course_duration);
    const courseTitle = cleanValue(certificate.course_title);
    const courseDisplay = buildCourseDisplay(courseDuration, courseTitle);
    const examMonth = cleanValue(certificate.exam_month);
    const passingYear = cleanValue(certificate.passing_year);
    const examPeriod = examMonth || passingYear;
    const examPeriodLabel = examMonth ? 'month of ' : 'year ';
    const result = cleanValue(certificate.result);
    const passportNo = cleanValue(certificate.passport_no, '........................');
    const issueDate = formatCertificateDate(certificate.issue_date) || formatCertificateDate(new Date().toISOString().slice(0, 10));

    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.serial, [
      { text: 'SL No : ', font: bodyFont },
      { text: safeSerial, font: valueFont, isValue: true },
    ]);
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
    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.examResultLine, [
      { text: `Course Examination held in the ${examPeriodLabel}`, font: bodyFont },
      { text: examPeriod, font: valueFont, isValue: true },
      ...getResultSegments(result, bodyFont, valueFont),
    ]);
    drawLayoutText(page, bodyFont, CERTIFICATE_TEXT_LAYOUT.scaleLine, 'On the scale of 4.00 at Under the "Education Program" National Youth Technical Training Center');
    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.passportLine, [
      { text: 'His/Her Passport Number as recorded in his/her registration book is ', font: bodyFont },
      { text: passportNo, font: valueFont, isValue: true },
    ]);
    drawLayoutSegments(page, CERTIFICATE_TEXT_LAYOUT.issueDate, [
      { text: 'Issue Date: ', font: bodyFont },
      { text: issueDate, font: valueFont, isValue: true },
    ]);

    const qrBytes = await fs.promises.readFile(qr.absolutePath);
    const qrImage = await pdfDoc.embedPng(qrBytes);
    const qrLayout = CERTIFICATE_TEXT_LAYOUT.qrCode;
    page.drawImage(qrImage, {
      x: qrLayout.x,
      y: qrLayout.y,
      width: qrLayout.width,
      height: qrLayout.height,
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
