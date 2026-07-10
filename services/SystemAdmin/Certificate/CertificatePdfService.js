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

const SAFE_AREA = {
  left: 158,
  right: 724,
  top: 432,
  bottom: 132,
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

function isNumericResult(result) {
  return /^[0-9]+(\.[0-9]+)?$/.test(cleanValue(result));
}

function resultDisplay(result) {
  const value = cleanValue(result);
  if (!value) return '';
  return `${isNumericResult(value) ? 'CGPA' : 'Grade'} ${value}`;
}

function buildCourseDisplay(courseDuration, courseTitle) {
  return [cleanValue(courseDuration), cleanValue(courseTitle)].filter(Boolean).join(' ');
}

function textWidth(font, text, size) {
  return font.widthOfTextAtSize(String(text || ''), size);
}

function fitText(text, font, size, maxWidth, minSize = 8) {
  const value = cleanValue(text);
  let fittedSize = size;
  while (value && maxWidth && fittedSize > minSize && textWidth(font, value, fittedSize) > maxWidth) {
    fittedSize -= 0.35;
  }
  return { text: value, size: fittedSize };
}

function drawDottedLine(page, x, y, width, options = {}) {
  if (width <= 0) return;
  const dash = options.dash || 2.2;
  const gap = options.gap || 2.4;
  const thickness = options.thickness || 0.45;
  for (let cursor = x; cursor < x + width; cursor += dash + gap) {
    page.drawLine({
      start: { x: cursor, y },
      end: { x: Math.min(cursor + dash, x + width), y },
      thickness,
      color: options.color || LINE_INK,
    });
  }
}

function drawValue(page, text, { x, y, width, font, size = 13.5, minSize = 8.5, align = 'center', placeholder = false }) {
  drawDottedLine(page, x, y - 3.2, width);
  const value = placeholder ? '' : cleanValue(text);
  if (!value) return;
  const fitted = fitText(value, font, size, width - 8, minSize);
  const valueWidth = textWidth(font, fitted.text, fitted.size);
  const offset = align === 'left' ? 4 : align === 'right' ? Math.max(4, width - valueWidth - 4) : Math.max(4, (width - valueWidth) / 2);
  page.drawText(fitted.text, { x: x + offset, y, size: fitted.size, font, color: INK });
}

function drawLabel(page, text, { x, y, font, size = 13, color = SOFT_INK }) {
  page.drawText(text, { x, y, size, font, color });
}

function drawCenteredText(page, text, { centerX, y, font, size, maxWidth, color = SOFT_INK }) {
  const fitted = fitText(text, font, size, maxWidth, 7.5);
  page.drawText(fitted.text, { x: centerX - textWidth(font, fitted.text, fitted.size) / 2, y, size: fitted.size, font, color });
}

function drawNarrativeLine(page, parts, { x, y, font, valueFont, size = 13.5, valueSize = 14.2, gap = 5 }) {
  let cursor = x;
  parts.forEach((part) => {
    if (part.type === 'label') {
      drawLabel(page, part.text, { x: cursor, y, font, size: part.size || size });
      cursor += textWidth(font, part.text, part.size || size) + gap;
    } else {
      drawValue(page, part.text, { x: cursor, y, width: part.width, font: valueFont, size: part.size || valueSize, align: part.align || 'center', placeholder: part.placeholder });
      cursor += part.width + gap;
    }
  });
}

function drawWrappedValue(page, text, { x, y, width, font, size = 13.5, lineGap = 19 }) {
  const words = cleanValue(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (textWidth(font, test, size) <= width - 10 || !current) current = test;
    else { lines.push(current); current = word; }
  });
  if (current) lines.push(current);
  lines.slice(0, 2).forEach((line, index) => {
    drawValue(page, line, { x, y: y - index * lineGap, width, font, size, align: 'center' });
  });
  return Math.min(lines.length || 1, 2);
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
    const studentName = cleanValue(certificate.s_name);
    const fatherName = cleanValue(certificate.f_name);
    const motherName = cleanValue(certificate.m_name);
    const instituteName = cleanValue(certificate.institute_name, 'National Youth Technical Training Center');
    const rollNo = cleanValue(certificate.roll_no || certificate.serial_no);
    const courseDisplay = buildCourseDisplay(certificate.course_duration, certificate.course_title);
    const examPeriod = cleanValue(certificate.exam_month) || cleanValue(certificate.passing_year);
    const passportNo = cleanValue(certificate.passport_no);
    const issueDate = formatCertificateDate(certificate.issue_date) || formatCertificateDate(new Date().toISOString().slice(0, 10));
    const resultText = resultDisplay(certificate.result);

    drawNarrativeLine(page, [
      { type: 'label', text: 'SL No :', size: 12.5 },
      { type: 'value', text: safeSerial, width: 116, size: 12.8, align: 'left' },
    ], { x: 86, y: 435, font: bodyFont, valueFont, gap: 4 });

    drawNarrativeLine(page, [
      { type: 'label', text: 'Reg. No :', size: 12.3 },
      { type: 'value', text: cleanValue(certificate.reg_no || certificate.id), width: 142, size: 12.5, align: 'left' },
    ], { x: 566, y: 428, font: bodyFont, valueFont, gap: 4 });
    drawNarrativeLine(page, [
      { type: 'label', text: 'Session :', size: 12.3 },
      { type: 'value', text: cleanValue(certificate.session), width: 142, size: 12.5, align: 'left' },
    ], { x: 566, y: 407, font: bodyFont, valueFont, gap: 4 });

    drawNarrativeLine(page, [
      { type: 'label', text: 'This is to certify that', size: 15 },
      { type: 'value', text: studentName, width: 342, size: 18.5 },
    ], { x: SAFE_AREA.left, y: 360, font: bodyFont, valueFont, valueSize: 18.5 });
    drawNarrativeLine(page, [
      { type: 'label', text: 'Son/daughter of', size: 14.2 },
      { type: 'value', text: fatherName, width: 214, size: 14.6 },
      { type: 'label', text: 'and', size: 14.2 },
      { type: 'value', text: motherName, width: 214, size: 14.6 },
    ], { x: SAFE_AREA.left, y: 326, font: bodyFont, valueFont });
    drawNarrativeLine(page, [
      { type: 'label', text: 'of', size: 14.2 },
      { type: 'value', text: instituteName, width: 532, size: 14.6 },
    ], { x: SAFE_AREA.left, y: 292, font: bodyFont, valueFont });

    drawNarrativeLine(page, [
      { type: 'label', text: 'bearing Roll No.', size: 13.7 },
      { type: 'value', text: rollNo, width: 122, size: 14.2 },
      { type: 'label', text: 'duly passed the', size: 13.7 },
    ], { x: SAFE_AREA.left, y: 250, font: bodyFont, valueFont });
    const courseLines = drawWrappedValue(page, courseDisplay, { x: 443, y: 250, width: 281, font: valueFont, size: 13.8 });

    const examY = courseLines > 1 ? 209 : 216;
    drawNarrativeLine(page, [
      { type: 'label', text: 'Course Examination held in the month/year of', size: 12.7 },
      { type: 'value', text: examPeriod, width: 118, size: 13.2 },
    ], { x: SAFE_AREA.left, y: examY, font: bodyFont, valueFont, gap: 4 });
    if (resultText) {
      drawNarrativeLine(page, [
        { type: 'label', text: 'and he/she secured', size: 12.7 },
        { type: 'value', text: resultText, width: 126, size: 13.8 },
      ], { x: 493, y: examY, font: bodyFont, valueFont, gap: 4 });
    }

    drawCenteredText(page, 'On the scale of 4.00 at Under the "Education Program" National Youth Technical Training Center', {
      centerX: (SAFE_AREA.left + SAFE_AREA.right) / 2,
      y: 178,
      font: bodyFont,
      size: 12.5,
      maxWidth: SAFE_AREA.right - SAFE_AREA.left,
    });
    drawNarrativeLine(page, [
      { type: 'label', text: 'His/Her Passport Number as recorded in his/her registration book is', size: 11.8 },
      { type: 'value', text: passportNo, width: 154, size: 12.8, placeholder: !passportNo },
    ], { x: SAFE_AREA.left, y: 150, font: bodyFont, valueFont, gap: 4 });

    drawNarrativeLine(page, [
      { type: 'label', text: 'Issue Date:', size: 12.2 },
      { type: 'value', text: issueDate, width: 130, size: 12.6, align: 'left' },
    ], { x: 92, y: 101, font: bodyFont, valueFont, gap: 4 });

    const qrSize = 66;
    const qrX = PAGE.width / 2 - qrSize / 2;
    const qrY = 58;
    const qrImage = await pdfDoc.embedPng(await fs.promises.readFile(qr.absolutePath));
    page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

    const signatureY = 92;
    const leftSig = { x: 255, width: 124 };
    const rightSig = { x: 462, width: 124 };
    [leftSig, rightSig].forEach((sig) => page.drawLine({ start: { x: sig.x, y: signatureY }, end: { x: sig.x + sig.width, y: signatureY }, thickness: 0.65, color: LINE_INK }));
    drawCenteredText(page, 'Exam Controller', { centerX: leftSig.x + leftSig.width / 2, y: signatureY - 18, font: bodyFont, size: 11.8, maxWidth: leftSig.width });
    drawCenteredText(page, 'Chairman', { centerX: rightSig.x + rightSig.width / 2, y: signatureY - 18, font: bodyFont, size: 11.8, maxWidth: rightSig.width });
    drawCenteredText(page, 'Note: This certificate is issued without any alteration or erasure.', {
      centerX: PAGE.width / 2,
      y: 30,
      font: bodyFont,
      size: 9.8,
      maxWidth: 520,
      color: rgb(0.25, 0.21, 0.17),
    });

    const fileName = `certificate-${safeSerial}.pdf`;
    const absolutePath = path.join(GENERATED_DIR, fileName);
    const publicPath = `${PUBLIC_GENERATED_DIR}/${fileName}`;
    await fs.promises.writeFile(absolutePath, await pdfDoc.save());
    return { absolutePath, publicPath, qrCodePath: qr.publicPath, verificationUrl: qr.verificationUrl };
  }
}

module.exports = CertificatePdfService;
