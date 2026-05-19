import QRCode from 'qrcode'
import crypto from 'crypto'

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
  return `evid_${crypto.randomBytes(16).toString('hex')}`
}
