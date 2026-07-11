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

const PAGE = { width: 841.89, height: 595.28 }; // A4 landscape points.
const PX_TO_PT = 72 / 96;
const INK = rgb(0.13, 0.1, 0.08);
const SOFT_INK = rgb(0.2, 0.16, 0.12);
const LINE_INK = rgb(0.38, 0.28, 0.18);

function pxToPt(px) {
  const value = Number(px);
  if (!Number.isFinite(value)) {
    throw new TypeError(`Invalid pixel value: ${px}`);
  }
  return value * PX_TO_PT;
}

const BODY_FONT_SIZE = pxToPt(22);
const BODY_MIN_FONT_SIZE = pxToPt(13);
const BODY_ROW_GAP = pxToPt(50);
const INLINE_GAP = pxToPt(12);
const HEADER_FONT_SIZE = pxToPt(16);
const META_FONT_SIZE = pxToPt(15);
const UNDERLINE_OFFSET = pxToPt(4.5);
const UNDERLINE_THICKNESS = 0.55;
const DOT_LENGTH = 2.1;
const DOT_GAP = 2.4;

const CERTIFICATE_LAYOUT = {
  safeLeft: 78,
  safeRight: 764,
  serial: { x: 105, y: 375, size: HEADER_FONT_SIZE, valueWidth: pxToPt(118) },
  meta: {
    labelX: 522,
    labelWidth: 112,
    valueX: 650,
    y: 421,
    rowGap: pxToPt(24),
    size: META_FONT_SIZE,
    valueWidth: 112,
  },
  body: {
    inset: pxToPt(50),
    y: 324,
    fontSize: BODY_FONT_SIZE,
    minFontSize: BODY_MIN_FONT_SIZE,
    rowGap: BODY_ROW_GAP,
  },
  bottom: { x: 82, y: 84, width: 678, height: 58, gap: pxToPt(24) },
  dates: { width: 205, size: pxToPt(12.25), lineGap: pxToPt(18.5) },
  compared: { width: 132 },
  qrCode: { width: pxToPt(96), height: pxToPt(96) },
  controller: { width: 175 },
};

const MONTHS = {
  jan: 'Jan', january: 'Jan',
  feb: 'Feb', february: 'Feb',
  mar: 'Mar', march: 'Mar',
  apr: 'Apr', april: 'Apr',
  may: 'May',
  jun: 'Jun', june: 'Jun',
  jul: 'Jul', july: 'Jul',
  aug: 'Aug', august: 'Aug',
  sep: 'Sep', sept: 'Sep', september: 'Sep',
  oct: 'Oct', october: 'Oct',
  nov: 'Nov', november: 'Nov',
  dec: 'Dec', december: 'Dec',
};
const MONTH_PATTERN = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');

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

function formatCgpa(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  return text ? cleanValue(text) : '';
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

function findYear(text, fromEnd = false) {
  const matches = cleanValue(text).match(/(?:19|20)\d{2}/g);
  if (!matches || !matches.length) return '';
  return fromEnd ? matches[matches.length - 1] : matches[0];
}

function findMonthYear(text, preferLast = true) {
  const normalized = cleanValue(text);
  if (!normalized) return null;
  const monthRegex = new RegExp(`\\b(${MONTH_PATTERN})\\b`, 'gi');
  const monthMatches = [...normalized.matchAll(monthRegex)];
  if (!monthMatches.length) return null;
  const selected = preferLast ? monthMatches[monthMatches.length - 1] : monthMatches[0];
  const month = MONTHS[selected[1].toLowerCase()];
  const afterMonth = normalized.slice(selected.index);
  const year = findYear(afterMonth) || findYear(normalized, true);
  return year ? { month, year } : null;
}

function deriveExamMonth({ examMonth, session, passingYear }) {
  const explicit = cleanValue(examMonth);
  const explicitMonthYear = findMonthYear(explicit, true);
  if (explicitMonthYear) return `${explicitMonthYear.month}-${explicitMonthYear.year}`;

  const sessionText = cleanValue(session);
  const sessionMonthYear = findMonthYear(sessionText, true);
  if (sessionMonthYear) return `${sessionMonthYear.month}-${sessionMonthYear.year}`;

  const sessionEndYear = findYear(sessionText, true);
  if (sessionEndYear) return sessionEndYear;

  const explicitYear = findYear(explicit, true);
  if (explicitYear) return explicitYear;

  return cleanValue(passingYear);
}

function textWidth(font, text, size) {
  return font.widthOfTextAtSize(String(text || ''), size);
}

function fitText(text, font, size, maxWidth, minSize = BODY_MIN_FONT_SIZE) {
  const fittedText = cleanValue(text);
  let fittedSize = size;
  while (fittedText && maxWidth && fittedSize > minSize && textWidth(font, fittedText, fittedSize) > maxWidth) {
    fittedSize -= 0.35;
  }
  fittedSize = Math.max(minSize, fittedSize);
  const fittedWidth = textWidth(font, fittedText, fittedSize);
  return { text: fittedText, size: fittedSize, width: fittedWidth, overflow: Boolean(fittedText && maxWidth && fittedWidth > maxWidth) };
}

function drawDottedLine(page, x, y, width, options = {}) {
  if (!width || width <= 0) return;
  const dash = options.dash || DOT_LENGTH;
  const gap = options.gap || DOT_GAP;
  for (let cursor = x; cursor < x + width; cursor += dash + gap) {
    page.drawLine({
      start: { x: cursor, y },
      end: { x: Math.min(cursor + dash, x + width), y },
      thickness: options.thickness || UNDERLINE_THICKNESS,
      color: options.color || LINE_INK,
    });
  }
}

function drawValueWithUnderline(page, value, options) {
  const { x, y, width, font, size, minSize = BODY_MIN_FONT_SIZE, align = 'center', color = INK } = options;
  drawDottedLine(page, x, y - UNDERLINE_OFFSET, width);
  const text = cleanValue(value);
  if (!text) return { endX: x + width, overflow: false, fittedSize: size };
  const fitted = fitText(text, font, size, width - pxToPt(8), minSize);
  const offset = align === 'left'
    ? pxToPt(4)
    : align === 'right'
      ? Math.max(pxToPt(4), width - fitted.width - pxToPt(4))
      : Math.max(pxToPt(4), (width - fitted.width) / 2);
  page.drawText(fitted.text, { x: x + offset, y, size: fitted.size, font, color });
  return { endX: x + width, overflow: fitted.overflow, fittedSize: fitted.size };
}

function drawText(page, text, options) {
  const { x, y, font, size, color = SOFT_INK, maxWidth, minSize = BODY_MIN_FONT_SIZE, align = 'left' } = options;
  const fitted = maxWidth ? fitText(text, font, size, maxWidth, minSize) : { text: cleanValue(text), size, width: textWidth(font, cleanValue(text), size), overflow: false };
  if (!fitted.text) return { width: 0, overflow: false };
  const offset = align === 'right' ? Math.max(0, (maxWidth || fitted.width) - fitted.width) : align === 'center' ? Math.max(0, ((maxWidth || fitted.width) - fitted.width) / 2) : 0;
  page.drawText(fitted.text, { x: x + offset, y, size: fitted.size, font, color });
  return { width: fitted.width, overflow: fitted.overflow, fittedSize: fitted.size };
}

function drawCenteredText(page, text, { centerX, y, font, size, maxWidth, color = SOFT_INK }) {
  const fitted = fitText(text, font, size, maxWidth, pxToPt(10));
  if (!fitted.text) return;
  page.drawText(fitted.text, { x: centerX - fitted.width / 2, y, size: fitted.size, font, color });
}

function bodyBounds() {
  const left = CERTIFICATE_LAYOUT.safeLeft + CERTIFICATE_LAYOUT.body.inset;
  const right = CERTIFICATE_LAYOUT.safeRight - CERTIFICATE_LAYOUT.body.inset;
  return { left, right, width: right - left };
}

function drawJustifiedLabelValueLine(page, { y, label, value }, fonts) {
  const { left, right } = bodyBounds();
  const size = CERTIFICATE_LAYOUT.body.fontSize;
  const labelWidth = textWidth(fonts.staticBodyFont, label, size);
  const valueX = left + labelWidth + INLINE_GAP;
  const valueWidth = Math.max(0, right - valueX);
  drawText(page, label, { x: left, y, font: fonts.staticBodyFont, size });
  drawValueWithUnderline(page, value, { x: valueX, y, width: valueWidth, font: fonts.dynamicFont, size });
}

function drawExamGradeLine(page, { y, examMonth, grade }, fonts) {
  const { left, right } = bodyBounds();
  const size = CERTIFICATE_LAYOUT.body.fontSize;
  const examLabel = 'Examination Held in the Month of';
  const gradeLabel = 'He/She Secured Grade';
  const examLabelWidth = textWidth(fonts.staticBodyFont, examLabel, size);
  const gradeLabelWidth = textWidth(fonts.staticBodyFont, gradeLabel, size);
  const compactGradeWidth = pxToPt(72);
  const examX = left + examLabelWidth + INLINE_GAP;
  const gradeValueX = right - compactGradeWidth;
  const gradeLabelX = gradeValueX - INLINE_GAP - gradeLabelWidth;
  const examWidth = Math.max(pxToPt(95), gradeLabelX - INLINE_GAP - examX);

  drawText(page, examLabel, { x: left, y, font: fonts.staticBodyFont, size });
  drawValueWithUnderline(page, examMonth, { x: examX, y, width: examWidth, font: fonts.dynamicFont, size });
  drawText(page, gradeLabel, { x: gradeLabelX, y, font: fonts.staticBodyFont, size });
  drawValueWithUnderline(page, grade, { x: gradeValueX, y, width: compactGradeWidth, font: fonts.dynamicFont, size });
}

function drawCgpaLine(page, { y, cgpa }, fonts) {
  const { left, right } = bodyBounds();
  const size = CERTIFICATE_LAYOUT.body.fontSize;
  const label = 'His/Her C.G.P.A';
  const scaleText = 'on a scale of 4.00.';
  const labelWidth = textWidth(fonts.staticBodyFont, label, size);
  const scaleWidth = textWidth(fonts.staticBodyFont, scaleText, size);
  const cgpaX = left + labelWidth + INLINE_GAP;
  const scaleX = right - scaleWidth;
  const cgpaWidth = Math.max(pxToPt(72), scaleX - INLINE_GAP - cgpaX);

  drawText(page, label, { x: left, y, font: fonts.staticBodyFont, size });
  drawValueWithUnderline(page, cgpa, { x: cgpaX, y, width: cgpaWidth, font: fonts.dynamicFont, size });
  drawText(page, scaleText, { x: scaleX, y, font: fonts.staticBodyFont, size });
}

function drawBottomSection(page, normalFont, values) {
  const layout = CERTIFICATE_LAYOUT.bottom;
  const dateX = layout.x;
  const comparedX = dateX + CERTIFICATE_LAYOUT.dates.width + layout.gap;
  const qrX = comparedX + CERTIFICATE_LAYOUT.compared.width + layout.gap;
  const controllerX = qrX + CERTIFICATE_LAYOUT.qrCode.width + layout.gap;
  const labelY = layout.y;
  const lineY = labelY + pxToPt(22.5);
  const dateTopY = labelY + pxToPt(36);

  drawText(page, 'Date of Publication of Result:', { x: dateX, y: dateTopY, font: normalFont, size: CERTIFICATE_LAYOUT.dates.size });
  drawText(page, values.publicationDate, { x: dateX + pxToPt(176), y: dateTopY, font: normalFont, size: CERTIFICATE_LAYOUT.dates.size, maxWidth: pxToPt(96), minSize: pxToPt(10), color: INK });
  drawText(page, 'Date of Issue:', { x: dateX, y: dateTopY - CERTIFICATE_LAYOUT.dates.lineGap, font: normalFont, size: CERTIFICATE_LAYOUT.dates.size });
  drawText(page, values.issueDate, { x: dateX + pxToPt(91), y: dateTopY - CERTIFICATE_LAYOUT.dates.lineGap, font: normalFont, size: CERTIFICATE_LAYOUT.dates.size, maxWidth: pxToPt(126), minSize: pxToPt(10), color: INK });

  [
    { x: comparedX, width: CERTIFICATE_LAYOUT.compared.width, label: 'Compared by' },
    { x: controllerX, width: CERTIFICATE_LAYOUT.controller.width, label: 'Deputy/Controller of Examinations' },
  ].forEach((signature) => {
    page.drawLine({ start: { x: signature.x + pxToPt(11), y: lineY }, end: { x: signature.x + signature.width - pxToPt(11), y: lineY }, thickness: 0.65, color: LINE_INK });
    drawCenteredText(page, signature.label, { centerX: signature.x + signature.width / 2, y: labelY, font: normalFont, size: pxToPt(13.5), maxWidth: signature.width - pxToPt(11) });
  });

  return { x: qrX, y: labelY - pxToPt(1), width: CERTIFICATE_LAYOUT.qrCode.width, height: CERTIFICATE_LAYOUT.qrCode.height };
}

async function readRequiredFont(fontPath, label) {
  try {
    return await fs.promises.readFile(fontPath);
  } catch (error) {
    console.error(`Certificate PDF font error: unable to read ${label} font at ${fontPath}`, error);
    throw new Error(`Certificate PDF font missing or unreadable: ${path.basename(fontPath)}`);
  }
}

async function embedCertificateFonts(pdfDoc) {
  if (!fontkit) {
    console.error('Certificate PDF font error: @pdf-lib/fontkit is not available.');
    throw new Error('Certificate PDF font embedding is unavailable. Please install @pdf-lib/fontkit.');
  }

  pdfDoc.registerFontkit(fontkit);
  try {
    const [dynamicFontBytes, staticFontBytes] = await Promise.all([
      readRequiredFont(DYNAMIC_FONT_PATH, 'dynamic'),
      readRequiredFont(STATIC_FONT_PATH, 'static'),
    ]);
    return {
      dynamicFont: await pdfDoc.embedFont(dynamicFontBytes, { subset: true }),
      staticBodyFont: await pdfDoc.embedFont(staticFontBytes, { subset: true }),
      normalFont: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    };
  } catch (error) {
    if (String(error.message || '').indexOf('Certificate PDF font') !== -1) throw error;
    console.error('Certificate PDF font error: unable to embed certificate fonts.', error);
    throw new Error('Certificate PDF font files are invalid or cannot be embedded.');
  }
}

class CertificatePdfService {
  static async generate(certificate) {
    const safeSerial = String(certificate.serial_no || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeSerial) throw new Error('Invalid certificate serial number for PDF generation.');
    if (!fs.existsSync(TEMPLATE_IMAGE_PATH)) throw new Error(TEMPLATE_IMAGE_MISSING_MESSAGE);

    const pdfDoc = await PDFDocument.create();
    const templateImage = await pdfDoc.embedPng(await fs.promises.readFile(TEMPLATE_IMAGE_PATH));
    const templateScale = {
      scaleX: PAGE.width / templateImage.width,
      scaleY: PAGE.height / templateImage.height,
      templatePxToPdfX: (px) => Number(px) * (PAGE.width / templateImage.width),
      templatePxToPdfY: (px) => Number(px) * (PAGE.height / templateImage.height),
    };
    void templateScale; // Template scale is calculated for artwork-relative measurements; current layout constants are PDF/CSS-point based.
    const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
    page.drawImage(templateImage, { x: 0, y: 0, width: PAGE.width, height: PAGE.height });

    const { staticBodyFont, dynamicFont, normalFont } = await embedCertificateFonts(pdfDoc);
    await fs.promises.mkdir(GENERATED_DIR, { recursive: true });
    const qr = await CertificateQrService.generate(safeSerial);
    const layout = CERTIFICATE_LAYOUT;
    const studentName = cleanValue(certificate.s_name);
    const parentNames = buildParentDisplay(certificate.f_name, certificate.m_name);
    const courseDisplay = buildCourseDisplay(certificate.course_title, certificate.course_duration);
    const examPeriod = deriveExamMonth({ examMonth: certificate.exam_month, session: certificate.session, passingYear: certificate.passing_year });
    const grade = formatGrade(certificate.result, certificate.grade);
    const cgpa = formatCgpa(certificate.cgpa);
    const issueDate = formatCertificateDate(certificate.issue_date) || formatCertificateDate(new Date().toISOString().slice(0, 10));
    const publicationDate = formatCertificateDate(certificate.publication_date || certificate.result_publication_date || certificate.published_at);

    drawText(page, 'SL No-', { x: layout.serial.x, y: layout.serial.y, font: normalFont, size: layout.serial.size });
    drawValueWithUnderline(page, formatSerial(safeSerial), { x: layout.serial.x + pxToPt(58), y: layout.serial.y, width: layout.serial.valueWidth, font: dynamicFont, size: layout.serial.size, minSize: pxToPt(12), align: 'left' });

    drawText(page, 'Registration No.', { x: layout.meta.labelX, y: layout.meta.y, font: normalFont, size: layout.meta.size, maxWidth: layout.meta.labelWidth, align: 'right' });
    drawValueWithUnderline(page, cleanValue(certificate.reg_no || certificate.id), { x: layout.meta.valueX, y: layout.meta.y, width: layout.meta.valueWidth, font: dynamicFont, size: layout.meta.size, minSize: pxToPt(10), align: 'left' });
    drawText(page, 'Session.', { x: layout.meta.labelX, y: layout.meta.y - layout.meta.rowGap, font: normalFont, size: layout.meta.size, maxWidth: layout.meta.labelWidth, align: 'right' });
    drawValueWithUnderline(page, cleanValue(certificate.session), { x: layout.meta.valueX, y: layout.meta.y - layout.meta.rowGap, width: layout.meta.valueWidth, font: dynamicFont, size: layout.meta.size, minSize: pxToPt(10), align: 'left' });

    const y = layout.body.y;
    const fonts = { staticBodyFont, dynamicFont };
    drawJustifiedLabelValueLine(page, { y, label: 'This Is To Certify That', value: studentName }, fonts);
    drawJustifiedLabelValueLine(page, { y: y - layout.body.rowGap, label: 'Son/Daughter of', value: parentNames }, fonts);
    drawJustifiedLabelValueLine(page, { y: y - layout.body.rowGap * 2, label: 'He/She Successfully Completed The', value: courseDisplay }, fonts);
    drawExamGradeLine(page, { y: y - layout.body.rowGap * 3, examMonth: examPeriod, grade }, fonts);
    drawCgpaLine(page, { y: y - layout.body.rowGap * 4, cgpa }, fonts);

    const qrPlacement = drawBottomSection(page, normalFont, { issueDate, publicationDate });
    const qrImage = await pdfDoc.embedPng(await fs.promises.readFile(qr.absolutePath));
    page.drawImage(qrImage, qrPlacement);
    const fileName = `certificate-${safeSerial}.pdf`;
    const absolutePath = path.join(GENERATED_DIR, fileName);
    const publicPath = `${PUBLIC_GENERATED_DIR}/${fileName}`;
    await fs.promises.writeFile(absolutePath, await pdfDoc.save());
    return { absolutePath, publicPath, qrCodePath: qr.publicPath, verificationUrl: qr.verificationUrl };
  }
}

module.exports = CertificatePdfService;
