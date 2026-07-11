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
const DYNAMIC_FONT_PATH = path.join(FONT_DIR, 'Quintessential-Regular.ttf');
const STATIC_FONT_PATH = path.join(FONT_DIR, 'UnifrakturMaguntia-Regular.ttf');

const PAGE = { width: 841.89, height: 595.28 }; // A4 landscape points, matching the existing generator.
const INK = rgb(0.13, 0.1, 0.08);
const SOFT_INK = rgb(0.2, 0.16, 0.12);
const LINE_INK = rgb(0.38, 0.28, 0.18);
const DISCLAIMER_RED = rgb(0.64, 0.05, 0.04);

const CERTIFICATE_LAYOUT = {
  safeLeft: 78,
  safeRight: 764,
  serial: { x: 105, y: 425, size: 13, valueWidth: 82 },
  meta: { labelX: 565, valueX: 655, y: 426, rowGap: 18, labelSize: 12.2, valueSize: 12.2, valueWidth: 118 },
  body: { x: 145, y: 324, width: 552, rowGap: 38, staticSize: 17.6, valueSize: 17.2 },
  bottom: { x: 82, y: 84, width: 678, height: 58, gap: 18 },
  dates: { width: 205, size: 9.2, lineGap: 14 },
  compared: { width: 132 },
  qrCode: { width: 82, height: 82 },
  controller: { width: 175 },
  disclaimer: { y: 28, size: 10.5 },
};

function cleanValue(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (!text) return fallback;
  if (['n/a', 'undefined', 'null', 'nan', '[object object]'].includes(text.toLowerCase())) return fallback;
  return text;
}

function formatSerial(value) {
  const serial = cleanValue(value).replace(/[^a-zA-Z0-9_-]/g, '');
  return /^\d+$/.test(serial) ? serial.padStart(7, '0') : serial;
}

function formatCertificateDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanValue(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '.';
}

function formatCgpa(result) {
  const value = cleanValue(result);
  if (!value) return '';
  const match = value.match(/\d+(?:\.\d+)?/);
  return match ? match[0] : '';
}

function formatGrade(result, fallbackGrade) {
  const directGrade = cleanValue(fallbackGrade);
  if (directGrade) return directGrade;
  const value = cleanValue(result);
  if (!value || /^\d+(?:\.\d+)?$/.test(value)) return '';
  return value.replace(/^grade\s*/i, '').trim();
}

function buildParentDisplay(fatherName, motherName) {
  const parts = [cleanValue(fatherName), cleanValue(motherName)].filter(Boolean);
  return parts.join(' & ');
}

function buildCourseDisplay(courseTitle, courseDuration) {
  const title = cleanValue(courseTitle);
  const duration = cleanValue(courseDuration);
  if (title && duration) return `${title} (${duration})`;
  return title || duration;
}

function textWidth(font, text, size) {
  return font.widthOfTextAtSize(String(text || ''), size);
}

function fitText(text, font, size, maxWidth, minSize = 8.5) {
  let fittedSize = size;
  const fittedText = cleanValue(text);
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
      thickness: options.thickness || 0.55,
      color: options.color || LINE_INK,
    });
  }
}

function drawValueWithUnderline(page, value, options) {
  const { x, y, width, font, size, minSize = 8.5, align = 'center', color = INK } = options;
  drawDottedLine(page, x, y - 3.4, width);
  const text = cleanValue(value);
  if (!text) return;
  const fitted = fitText(text, font, size, width - 8, minSize);
  const fittedWidth = textWidth(font, fitted.text, fitted.size);
  const offset = align === 'left' ? 4 : align === 'right' ? Math.max(4, width - fittedWidth - 4) : Math.max(4, (width - fittedWidth) / 2);
  page.drawText(fitted.text, { x: x + offset, y, size: fitted.size, font, color });
}

function drawText(page, text, options) {
  const { x, y, font, size, color = SOFT_INK, maxWidth, minSize = 8.5 } = options;
  const fitted = maxWidth ? fitText(text, font, size, maxWidth, minSize) : { text: cleanValue(text), size };
  if (!fitted.text) return 0;
  page.drawText(fitted.text, { x, y, size: fitted.size, font, color });
  return textWidth(font, fitted.text, fitted.size);
}

function drawCenteredText(page, text, { centerX, y, font, size, maxWidth, color = SOFT_INK }) {
  const fitted = fitText(text, font, size, maxWidth, 7.5);
  if (!fitted.text) return;
  page.drawText(fitted.text, { x: centerX - textWidth(font, fitted.text, fitted.size) / 2, y, size: fitted.size, font, color });
}

function drawCertificateLine(page, columns, y, fonts) {
  let cursor = CERTIFICATE_LAYOUT.body.x;
  columns.forEach((column) => {
    if (column.kind === 'static') {
      cursor += drawText(page, column.text, { x: cursor, y, font: fonts.bodyFont, size: column.size || CERTIFICATE_LAYOUT.body.staticSize, maxWidth: column.maxWidth });
    } else if (column.kind === 'gap') {
      cursor += column.width;
    } else {
      drawValueWithUnderline(page, column.text, { x: cursor, y, width: column.width, font: fonts.valueFont, size: column.size || CERTIFICATE_LAYOUT.body.valueSize, minSize: column.minSize || 9.5 });
      cursor += column.width;
    }
  });
}

function drawBottomSection(page, bodyFont, valueFont, values, options = {}) {
  const layout = CERTIFICATE_LAYOUT.bottom;
  const dateX = layout.x;
  const comparedX = dateX + CERTIFICATE_LAYOUT.dates.width + layout.gap;
  const qrX = comparedX + CERTIFICATE_LAYOUT.compared.width + layout.gap;
  const controllerX = qrX + CERTIFICATE_LAYOUT.qrCode.width + layout.gap;
  const labelY = layout.y;
  const lineY = labelY + 17;
  const dateTopY = labelY + 27;

  drawText(page, 'Date of Publication of Result:', { x: dateX, y: dateTopY, font: bodyFont, size: CERTIFICATE_LAYOUT.dates.size });
  drawText(page, values.publicationDate, { x: dateX + 132, y: dateTopY, font: valueFont, size: CERTIFICATE_LAYOUT.dates.size, maxWidth: 70, minSize: 7.5, color: INK });
  drawText(page, 'Date of Issue:', { x: dateX, y: dateTopY - CERTIFICATE_LAYOUT.dates.lineGap, font: bodyFont, size: CERTIFICATE_LAYOUT.dates.size });
  drawText(page, values.issueDate, { x: dateX + 68, y: dateTopY - CERTIFICATE_LAYOUT.dates.lineGap, font: valueFont, size: CERTIFICATE_LAYOUT.dates.size, maxWidth: 95, minSize: 7.5, color: INK });

  [
    { x: comparedX, width: CERTIFICATE_LAYOUT.compared.width, label: options.canDrawCheckMark ? 'Compared ✓ by' : 'Compared by' },
    { x: controllerX, width: CERTIFICATE_LAYOUT.controller.width, label: 'Deputy/Controller of Examinations' },
  ].forEach((signature) => {
    page.drawLine({ start: { x: signature.x + 8, y: lineY }, end: { x: signature.x + signature.width - 8, y: lineY }, thickness: 0.65, color: LINE_INK });
    drawCenteredText(page, signature.label, { centerX: signature.x + signature.width / 2, y: labelY, font: bodyFont, size: 10.2, maxWidth: signature.width - 8 });
  });

  return { x: qrX, y: labelY - 1, width: CERTIFICATE_LAYOUT.qrCode.width, height: CERTIFICATE_LAYOUT.qrCode.height };
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

async function embedCertificateFonts(pdfDoc) {
  if (fontkit && fs.existsSync(DYNAMIC_FONT_PATH) && fs.existsSync(STATIC_FONT_PATH)) {
    pdfDoc.registerFontkit(fontkit);
    return {
      valueFont: await pdfDoc.embedFont(await fs.promises.readFile(DYNAMIC_FONT_PATH), { subset: true }),
      bodyFont: await pdfDoc.embedFont(await fs.promises.readFile(STATIC_FONT_PATH), { subset: true }),
      usingCertificateFonts: true,
    };
  }
  return {
    valueFont: await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
    bodyFont: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
    usingCertificateFonts: false,
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
    page.drawImage(templateImage, { x: 0, y: 0, width: PAGE.width, height: PAGE.height });

    const { bodyFont, valueFont, usingCertificateFonts } = await embedCertificateFonts(pdfDoc);
    const layout = CERTIFICATE_LAYOUT;
    const studentName = cleanValue(certificate.s_name);
    const parentNames = buildParentDisplay(certificate.f_name, certificate.m_name);
    const courseDisplay = buildCourseDisplay(certificate.course_title, certificate.course_duration);
    const examMonth = cleanValue(certificate.exam_month) || cleanValue(certificate.passing_year);
    const grade = formatGrade(certificate.result, certificate.grade);
    const cgpa = formatCgpa(certificate.cgpa || certificate.result);
    const issueDate = formatCertificateDate(certificate.issue_date) || formatCertificateDate(new Date().toISOString().slice(0, 10));
    const publicationDate = formatCertificateDate(certificate.publication_date || certificate.result_publication_date || certificate.published_at);

    drawText(page, 'SL No-', { x: layout.serial.x, y: layout.serial.y, font: bodyFont, size: layout.serial.size });
    drawText(page, formatSerial(safeSerial), { x: layout.serial.x + 42, y: layout.serial.y, font: valueFont, size: layout.serial.size, maxWidth: layout.serial.valueWidth, color: INK });

    drawText(page, 'Registration No.', { x: layout.meta.labelX, y: layout.meta.y, font: bodyFont, size: layout.meta.labelSize });
    drawText(page, cleanValue(certificate.reg_no || certificate.id), { x: layout.meta.valueX, y: layout.meta.y, font: valueFont, size: layout.meta.valueSize, maxWidth: layout.meta.valueWidth, minSize: 8, color: INK });
    drawText(page, 'Session.', { x: layout.meta.labelX + 42, y: layout.meta.y - layout.meta.rowGap, font: bodyFont, size: layout.meta.labelSize });
    drawText(page, cleanValue(certificate.session), { x: layout.meta.valueX, y: layout.meta.y - layout.meta.rowGap, font: valueFont, size: layout.meta.valueSize, maxWidth: layout.meta.valueWidth, minSize: 8, color: INK });

    const y = layout.body.y;
    drawCertificateLine(page, [
      { kind: 'static', text: 'This Is To Certify That', size: 18.8 },
      { kind: 'gap', width: 13 },
      { kind: 'value', text: studentName, width: 320, size: 20.2, minSize: 12 },
    ], y, { bodyFont, valueFont });

    drawCertificateLine(page, [
      { kind: 'static', text: 'Son/Daughter of' },
      { kind: 'gap', width: 13 },
      { kind: 'value', text: parentNames, width: 382, minSize: 10 },
    ], y - layout.body.rowGap, { bodyFont, valueFont });

    drawCertificateLine(page, [
      { kind: 'static', text: 'He/She Successfully Completed The', size: 16.2 },
      { kind: 'gap', width: 12 },
      { kind: 'value', text: courseDisplay, width: 330, size: 15.8, minSize: 8.8 },
    ], y - layout.body.rowGap * 2, { bodyFont, valueFont });

    drawCertificateLine(page, [
      { kind: 'static', text: 'Examination Held in the Month of', size: 14.4 },
      { kind: 'gap', width: 8 },
      { kind: 'value', text: examMonth, width: 118, size: 14.3, minSize: 8.8 },
      { kind: 'gap', width: 10 },
      { kind: 'static', text: 'He/She Secured Grade', size: 14.4 },
      { kind: 'gap', width: 8 },
      { kind: 'value', text: grade, width: 54, size: 14.6, minSize: 8.8 },
    ], y - layout.body.rowGap * 3, { bodyFont, valueFont });

    drawCertificateLine(page, [
      { kind: 'static', text: 'His/Her C.G.P.A' },
      { kind: 'gap', width: 10 },
      { kind: 'value', text: cgpa, width: 76, size: 16.4, minSize: 10 },
      { kind: 'gap', width: 10 },
      { kind: 'static', text: 'on a scale of 4.00.' },
    ], y - layout.body.rowGap * 4, { bodyFont, valueFont });

    const qrPlacement = drawBottomSection(page, bodyFont, valueFont, { issueDate, publicationDate }, { canDrawCheckMark: usingCertificateFonts });
    const qrImage = await pdfDoc.embedPng(await fs.promises.readFile(qr.absolutePath));
    page.drawImage(qrImage, qrPlacement);
    drawDisclaimer(page, bodyFont);

    const fileName = `certificate-${safeSerial}.pdf`;
    const absolutePath = path.join(GENERATED_DIR, fileName);
    const publicPath = `${PUBLIC_GENERATED_DIR}/${fileName}`;
    await fs.promises.writeFile(absolutePath, await pdfDoc.save());
    return { absolutePath, publicPath, qrCodePath: qr.publicPath, verificationUrl: qr.verificationUrl };
  }
}

module.exports = CertificatePdfService;
