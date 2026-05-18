import QRCode from 'qrcode'

export async function generateEvidenceQR(evidenceUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(evidenceUrl, {
    width: 100,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  })
}

export function generateEvidenceToken(): string {
  return `evid_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
}
