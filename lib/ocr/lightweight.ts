import { createWorker } from 'tesseract.js'

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    // Modern Tesseract.js v4/v5 initialization one-liner
    const worker = await createWorker('eng')
    const { data: { text } } = await worker.recognize(buffer)
    await worker.terminate()
    return text
  } catch (err) {
    console.error('Tesseract.js OCR processing error:', err)
    return ''
  }
}
