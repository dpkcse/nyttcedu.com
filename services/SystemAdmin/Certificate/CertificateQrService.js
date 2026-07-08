const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const PUBLIC_QR_DIR = '/uploads/certificates/qr';
const QR_DIR = path.join(process.cwd(), 'public', 'uploads', 'certificates', 'qr');

class CertificateQrService {
  static getVerificationUrl(serialNo) {
    const baseUrl = process.env.PUBLIC_SITE_URL || 'https://nyttcedu.com';
    return `${baseUrl.replace(/\/$/, '')}/certification/verify/${encodeURIComponent(serialNo)}`;
  }

  static async generate(serialNo) {
    const safeSerial = String(serialNo || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeSerial) {
      throw new Error('Invalid certificate serial number for QR generation.');
    }

    await fs.promises.mkdir(QR_DIR, { recursive: true });
    const fileName = `qr-${safeSerial}.png`;
    const absolutePath = path.join(QR_DIR, fileName);
    const publicPath = `${PUBLIC_QR_DIR}/${fileName}`;
    const verificationUrl = CertificateQrService.getVerificationUrl(safeSerial);

    await QRCode.toFile(absolutePath, verificationUrl, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 220,
    });

    return { absolutePath, publicPath, verificationUrl };
  }
}

module.exports = CertificateQrService;
