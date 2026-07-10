const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const CertificateQrService = require('./CertificateQrService');

let fontkit = null;
try {
  fontkit = require('@pdf-lib/fontkit');
} catch (error) {
  fontkit = null;
}

const TEMPLATE_IMAGE_PATH = process.env.CERTIFICATE_TEMPLATE_IMAGE_PATH || path.join(process.cwd(), 'public', 'uploads', 'certificates', 'templates', 'blank-certificate.png');
const TEMPLATE_IMAGE_MISSING_MESSAGE = 'Certificate PNG template not found. Please upload blank-certificate.png to public/uploads/certificates/templates/';
const GENERATED_DIR = path.join(process.cwd(), 'public', 'uploads', 'certificates', 'generated');
const PUBLIC_GENERATED_DIR = '/uploads/certificates/generated';
const FONT_DIR = path.join(process.cwd(), 'public', 'assets', 'fonts', 'certificates');
const DYNAMIC_FONT_PATH = path.join(FONT_DIR, 'PlaywriteID-Regular.ttf');
const STATIC_FONT_PATH = path.join(FONT_DIR, 'Satisfy-Regular.ttf');

const PAGE = { width: 841.89, height: 595.28 };
const INK = rgb(0.13, 0.1, 0.08);
const SOFT_INK = rgb(0.2, 0.16, 0.12);
const LINE_INK = rgb(0.38, 0.28, 0.18);
const DISCLAIMER_RED = rgb(0.64, 0.05, 0.04);

const CERTIFICATE_LAYOUT = {
  serial: { x: 120, y: 425, size: 12, valueWidth: 110 },

  regLabel: { x: 560, y: 405, size: 12 },
  regValue: { x: 625, y: 405, size: 12, width: 138 },
  sessionLabel: { x: 560, y: 385, size: 12 },
  sessionValue: { x: 625, y: 385, size: 12, width: 138 },

  bodyLeft: 190,
  bodyRight: 720,
  line1Y: 335,
  lineGap: 30,

  studentName: { size: 17, width: 315 },
  bodyStatic: { size: 14 },
  bodyValue: { size: 14.5 },

  fatherLineY: 305,
  motherLineY: 275,
  instituteLineY: 245,

  courseLine1Y: 215,
  courseLine2Y: 195,
  examLineY: 174,
  scaleLineY: 150,
  passportLineY: 126,

  issueDate: { x: 80, y: 92, size: 12, valueWidth: 132 },

  qrCode: { x: 386, y: 68, width: 70, height: 70 },

  examControllerLine: { x1: 210, y: 105, x2: 330, y2: 105 },
  examControllerLabel: { x: 235, y: 85, size: 11 },

  chairmanLine: { x1: 515, y: 105, x2: 635, y2: 105 },
  chairmanLabel: { x: 550, y: 85, size: 11 },

  disclaimer: { y: 28, size: 10.5 },
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
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function textWidth(font, text, size) {
  return font.widthOfTextAtSize(String(text || ''), size);
}

function fitText(text, font, size, maxWidth, minSize = 8) {
  let fittedSize = size;
  const fittedText = String(text || '');
  while (fittedText && maxWidth && fittedSize > minSize && textWidth(font, fittedText, fittedSize) > maxWidth) {
    fittedSize -= 0.35;
  }
  return { text: fittedText, size: fittedSize };
}

function drawDottedLine(page, x, y, width, options = {}) {
  if (!width || width <= 0) return;
  const dash = options.dash || 2.1;
  const gap = options.gap || 2.4;
  for (let cursor = x; cursor < x + width; cursor += dash + gap) {
    page.drawLine({
      start: { x: cursor, y },
      end: { x: Math.min(cursor + dash, x + width), y },
      thickness: options.thickness || 0.45,
      color: options.color || LINE_INK,
    });
  }
}

function drawValueWithUnderline(page, value, options) {
  const {
    x,
    y,
    width,
    font,
    size = CERTIFICATE_LAYOUT.bodyValue.size,
    minSize = 8,
    align = 'center',
    color = INK,
    placeholder = false,
  } = options;
  drawDottedLine(page, x, y - 3.2, width);
  const text = placeholder ? '' : cleanValue(value);
  if (!text) return width;
  const fitted = fitText(text, font, size, width - 8, minSize);
  const fittedWidth = textWidth(font, fitted.text, fitted.size);
  const offset = align === 'left'
    ? 4
    : align === 'right'
      ? Math.max(4, width - fittedWidth - 4)
      : Math.max(4, (width - fittedWidth) / 2);
  page.drawText(fitted.text, { x: x + offset, y, size: fitted.size, font, color });
  return width;
}

function segmentText(segment) {
  return segment.isValue ? cleanValue(segment.text) : String(segment.text || '');
}

function drawSegmentsPreserveSpaces(page, segments, { x, y, size, font, valueFont, color = SOFT_INK }) {
  let cursor = x;
  segments.forEach((segment) => {
    if (segment.isValue) {
      cursor += drawValueWithUnderline(page, segment.text, {
        x: cursor,
        y,
        width: segment.width,
        font: segment.font || valueFont,
        size: segment.size || size,
        align: segment.align || 'center',
        placeholder: segment.placeholder,
      });
      return;
    }
    const text = segmentText(segment);
    if (!text) return;
    const staticFont = segment.font || font;
    const staticSize = segment.size || size;
    page.drawText(text, { x: cursor, y, size: staticSize, font: staticFont, color: segment.color || color });
    cursor += textWidth(staticFont, text, staticSize);
  });
  return cursor - x;
}

function wrapTextToLines(text, font, size, maxWidth, maxLines = 2) {
  const words = cleanValue(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (!current || textWidth(font, next, size) <= maxWidth) {
      current = next;
      return;
    }
    lines.push(current);
    current = word;
  });
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = `${visible[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`;
  return visible;
}

function drawCenteredText(page, text, { centerX, y, font, size, maxWidth, color = SOFT_INK }) {
  const fitted = fitText(cleanValue(text), font, size, maxWidth, 7.5);
  page.drawText(fitted.text, { x: centerX - textWidth(font, fitted.text, fitted.size) / 2, y, size: fitted.size, font, color });
}

function drawSignatureSection(page, bodyFont) {
  const { qrCode, examControllerLine, examControllerLabel, chairmanLine, chairmanLabel } = CERTIFICATE_LAYOUT;
  [examControllerLine, chairmanLine].forEach((line) => {
    page.drawLine({
      start: { x: line.x1, y: line.y },
      end: { x: line.x2, y: line.y2 },
      thickness: 0.65,
      color: LINE_INK,
    });
  });
  page.drawText('Exam Controller', { x: examControllerLabel.x, y: examControllerLabel.y, size: examControllerLabel.size, font: bodyFont, color: SOFT_INK });
  page.drawText('Chairman', { x: chairmanLabel.x, y: chairmanLabel.y, size: chairmanLabel.size, font: bodyFont, color: SOFT_INK });
  return qrCode;
}

function drawDisclaimer(page, bodyFont) {
  drawCenteredText(page, 'This Certificate is issued without any alteration or erasure', {
    centerX: PAGE.width / 2,
    y: CERTIFICATE_LAYOUT.disclaimer.y,
    font: bodyFont,
    size: CERTIFICATE_LAYOUT.disclaimer.size,
    maxWidth: 480,
    color: DISCLAIMER_RED,
  });
}

function drawImageFullPage(page, image) {
  page.drawImage(image, { x: 0, y: 0, width: PAGE.width, height: PAGE.height });
}

async function embedCertificateFonts(pdfDoc) {
  if (fontkit && fs.existsSync(DYNAMIC_FONT_PATH) && fs.existsSync(STATIC_FONT_PATH)) {
    pdfDoc.registerFontkit(fontkit);
    return {
      valueFont: await pdfDoc.embedFont(await fs.promises.readFile(DYNAMIC_FONT_PATH), { subset: true }),
      bodyFont: await pdfDoc.embedFont(await fs.promises.readFile(STATIC_FONT_PATH), { subset: true }),
    };
  }
  return {
    valueFont: await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
    bodyFont: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
  };
}

function resultDisplay(result) {
  const value = cleanValue(result);
  if (!value) return '';
  return `${/^[0-9]+(\.[0-9]+)?$/.test(value) ? 'CGPA' : 'Grade'} ${value}`;
}

function buildCourseDisplay(courseTitle, courseDuration) {
  const title = cleanValue(courseTitle);
  const duration = cleanValue(courseDuration);
  if (title && duration) return `${title} (${duration})`;
  return title || duration;
}

class CertificatePdfService {
  static async generate(certificate) {
    const safeSerial = String(certificate.serial_no || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeSerial) throw new Error('Invalid certificate serial number for PDF generation.');
    if (!fs.existsSync(TEMPLATE_IMAGE_PATH)) throw new Error(TEMPLATE_IMAGE_MISSING_MESSAGE);

    await fs.promises.mkdir(GENERATED_DIR, { recursive: true });
    const qr = await CertificateQrService.generate(safeSerial);
    const pdfDoc = await PDFDocument.create();
    const templateImage = await pdfDoc.embedPng(await fs.promises.readFile(TEMPLATE_IMAGE_PATH));
    const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
    drawImageFullPage(page, templateImage);

    const { bodyFont, valueFont } = await embedCertificateFonts(pdfDoc);
    const layout = CERTIFICATE_LAYOUT;
    const studentName = cleanValue(certificate.s_name);
    const fatherName = cleanValue(certificate.f_name);
    const motherName = cleanValue(certificate.m_name);
    const instituteName = cleanValue(certificate.institute_name, 'National Youth Technical Training Center');
    const rollNo = cleanValue(certificate.roll_no || certificate.serial_no);
    const courseDisplay = buildCourseDisplay(certificate.course_title, certificate.course_duration);
    const examPeriod = cleanValue(certificate.exam_month) || cleanValue(certificate.passing_year);
    const passportNo = cleanValue(certificate.passport_no);
    const issueDate = formatCertificateDate(certificate.issue_date) || formatCertificateDate(new Date().toISOString().slice(0, 10));
    const resultText = resultDisplay(certificate.result);

    drawSegmentsPreserveSpaces(page, [
      { text: 'SL No : ', size: layout.serial.size },
      { text: safeSerial, isValue: true, width: layout.serial.valueWidth, size: layout.serial.size, align: 'left' },
    ], { x: layout.serial.x, y: layout.serial.y, size: layout.serial.size, font: bodyFont, valueFont });

    page.drawText('Reg. No :', { x: layout.regLabel.x, y: layout.regLabel.y, size: layout.regLabel.size, font: bodyFont, color: SOFT_INK });
    drawValueWithUnderline(page, cleanValue(certificate.reg_no || certificate.id), { x: layout.regValue.x, y: layout.regValue.y, width: layout.regValue.width, size: layout.regValue.size, font: valueFont, align: 'left' });
    page.drawText('Session :', { x: layout.sessionLabel.x, y: layout.sessionLabel.y, size: layout.sessionLabel.size, font: bodyFont, color: SOFT_INK });
    drawValueWithUnderline(page, cleanValue(certificate.session), { x: layout.sessionValue.x, y: layout.sessionValue.y, width: layout.sessionValue.width, size: layout.sessionValue.size, font: valueFont, align: 'left' });

    drawSegmentsPreserveSpaces(page, [
      { text: 'This is to certify that ', size: 15 },
      { text: studentName, isValue: true, width: layout.studentName.width, size: layout.studentName.size },
    ], { x: layout.bodyLeft, y: layout.line1Y, size: layout.bodyStatic.size, font: bodyFont, valueFont });

    drawSegmentsPreserveSpaces(page, [
      { text: 'Son/daughter of ', size: layout.bodyStatic.size },
      { text: fatherName, isValue: true, width: 350, size: layout.bodyValue.size, align: 'center' },
      { text: '          (Father)', size: 12 },
    ], { x: layout.bodyLeft, y: layout.fatherLineY, size: layout.bodyStatic.size, font: bodyFont, valueFont });

    drawSegmentsPreserveSpaces(page, [
      { text: 'and ', size: layout.bodyStatic.size },
      { text: motherName, isValue: true, width: 450, size: layout.bodyValue.size, align: 'center' },
      { text: '          (Mother)', size: 12 },
    ], { x: layout.bodyLeft, y: layout.motherLineY, size: layout.bodyStatic.size, font: bodyFont, valueFont });

    drawSegmentsPreserveSpaces(page, [
      { text: 'of ', size: layout.bodyStatic.size },
      { text: instituteName, isValue: true, width: 502, size: layout.bodyValue.size, align: 'center' },
    ], { x: layout.bodyLeft, y: layout.instituteLineY, size: layout.bodyStatic.size, font: bodyFont, valueFont });

    drawSegmentsPreserveSpaces(page, [
      { text: 'bearing Roll No. ', size: 13.6 },
      { text: rollNo, isValue: true, width: 118, size: 14, align: 'center' },
      { text: ' duly passed the', size: 13.6 },
    ], { x: layout.bodyLeft, y: layout.courseLine1Y, size: layout.bodyStatic.size, font: bodyFont, valueFont });

    const courseLines = wrapTextToLines(courseDisplay, valueFont, 13.8, layout.bodyRight - 305, 2);
    courseLines.forEach((line, index) => {
      drawValueWithUnderline(page, line, {
        x: 305,
        y: layout.courseLine2Y - index * 18,
        width: layout.bodyRight - 305,
        font: valueFont,
        size: 13.8,
      });
    });

    const examY = courseLines.length > 1 ? layout.examLineY - 12 : layout.examLineY;
    const examSegments = [
      { text: 'Course Examination held in the month/year of ', size: 11.6 },
      { text: examPeriod, isValue: true, width: 100, size: 12.6, align: 'center' },
    ];
    if (resultText) {
      examSegments.push(
        { text: ' and he/she secured ', size: 11.6 },
        { text: resultText, isValue: true, width: 92, size: 12.8, align: 'center' },
      );
    }
    drawSegmentsPreserveSpaces(page, examSegments, { x: layout.bodyLeft, y: examY, size: 11.6, font: bodyFont, valueFont });

    drawCenteredText(page, 'On the scale of 4.00 at Under the "Education Program" National Youth Technical Training Center', {
      centerX: (layout.bodyLeft + layout.bodyRight) / 2,
      y: layout.scaleLineY,
      font: bodyFont,
      size: 12.2,
      maxWidth: layout.bodyRight - layout.bodyLeft,
    });

    drawSegmentsPreserveSpaces(page, [
      { text: 'Passport No. ', size: 11.8 },
      { text: passportNo, isValue: true, width: 128, size: 12.5, placeholder: !passportNo },
    ], { x: layout.bodyLeft, y: layout.passportLineY, size: 11.8, font: bodyFont, valueFont });

    drawSegmentsPreserveSpaces(page, [
      { text: 'Issue Date: ', size: layout.issueDate.size },
      { text: issueDate, isValue: true, width: layout.issueDate.valueWidth, size: layout.issueDate.size, align: 'left' },
    ], { x: layout.issueDate.x, y: layout.issueDate.y, size: layout.issueDate.size, font: bodyFont, valueFont });

    const qrImage = await pdfDoc.embedPng(await fs.promises.readFile(qr.absolutePath));
    page.drawImage(qrImage, layout.qrCode);
    drawSignatureSection(page, bodyFont);
    drawDisclaimer(page, bodyFont);

    const fileName = `certificate-${safeSerial}.pdf`;
    const absolutePath = path.join(GENERATED_DIR, fileName);
    const publicPath = `${PUBLIC_GENERATED_DIR}/${fileName}`;
    await fs.promises.writeFile(absolutePath, await pdfDoc.save());
    return { absolutePath, publicPath, qrCodePath: qr.publicPath, verificationUrl: qr.verificationUrl };
  }
}

module.exports = CertificatePdfService;
