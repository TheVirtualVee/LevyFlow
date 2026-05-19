import { createWorker } from 'tesseract.js'

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    const worker = await createWorker('eng')
    const { data: { text } } = await worker.recognize(buffer)
    await worker.terminate()
    return text
  } catch (err) {
    return ''
  }
}
