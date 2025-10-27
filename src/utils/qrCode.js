import QRCode from 'qrcode';

export async function generateQRCode(gearId) {
  try {
    const qrDataUrl = await QRCode.toDataURL(`GEAR:${gearId}`, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2
    });
    return qrDataUrl;
  } catch (err) {
    console.error('QR generation failed:', err);
    throw err;
  }
}
