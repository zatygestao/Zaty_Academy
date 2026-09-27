import QRCode from 'qrcode';

export async function generateQrCodeDataUrl(text, options = {}) {
  try {
    const opts = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      color: {
        dark: '#0B0F19',
        light: '#FFFFFF'
      },
      width: 250,
      ...options
    };

    return await QRCode.toDataURL(text, opts);
  } catch (err) {
    console.error('Erro ao gerar QR code:', err);
    return null;
  }
}
