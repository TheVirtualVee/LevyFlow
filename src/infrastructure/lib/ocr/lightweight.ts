import { createWorker } from 'tesseract.js'
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'

async function extractTextViaDocumentAI(buffer: Buffer): Promise<string> {
  const projectId = process.env.DOCUMENT_AI_PROJECT_ID
  const location = process.env.DOCUMENT_AI_LOCATION || 'us'
  const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID

  if (!projectId || !processorId) {
    throw new Error('Google Cloud Document AI environment variables are missing.')
  }

  let credentials = undefined
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    } catch (e) {
      console.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS_JSON:', e)
    }
  }

  const client = new DocumentProcessorServiceClient({
    credentials,
    projectId
  })

  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`
  
  const [result] = await client.processDocument({
    name,
    rawDocument: {
      content: buffer,
      mimeType: 'image/png'
    }
  })

  return result.document?.text || ''
}

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  // 1. Try Google Cloud Document AI first if environment is configured
  if (process.env.DOCUMENT_AI_PROJECT_ID || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const text = await extractTextViaDocumentAI(buffer)
      if (text && text.trim().length > 0) {
        return text
      }
    } catch (err) {
      console.warn('Google Cloud Document AI process failed. Falling back to local OCR...', err)
    }
  }

  // 2. Local fallback using lightweight Tesseract.js
  try {
    const worker = await createWorker('eng')
    const { data: { text } } = await worker.recognize(buffer)
    await worker.terminate()
    return text
  } catch (err) {
    console.error('Local OCR worker failed:', err)
    return ''
  }
}
