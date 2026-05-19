interface ReceiptData {
  amount: number | null
  date: Date | null
  sender: string | null
}

export function extractReceiptData(text: string): ReceiptData {
  if (!text) {
    return { amount: null, date: null, sender: null }
  }

  const amountPatterns = [
    /N(?:GN)?\s?([\d,]+(?:\.\d{2})?)/i,
    /₦\s?([\d,]+(?:\.\d{2})?)/,
    /Amount:\s?([\d,]+(?:\.\d{2})?)/i,
    /Total:\s?([\d,]+(?:\.\d{2})?)/i,
    /([\d,]+(?:\.\d{2})?)\s?(?:NGN|Naira)/i
  ]
  
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
    /(\d{1,2})-(\d{1,2})-(\d{2,4})/,
    /(\d{4})-(\d{2})-(\d{2})/
  ]

  const senderPatterns = [
    /(?:sender name|sender|paid by|transfer from|from|account name|payer):\s*([a-zA-Z\s]{3,40})/i,
    /([a-zA-Z\s]{3,30})\s*(?:has sent you|transferred|sent)/i
  ]
  
  let amount: number | null = null
  for (const pattern of amountPatterns) {
    const match = text.match(pattern)
    if (match) {
      const parsedAmount = parseFloat(match[1].replace(/,/g, ''))
      if (!isNaN(parsedAmount)) {
        amount = parsedAmount
        break
      }
    }
  }
  
  let date: Date | null = null
  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      const dateStr = match[0]
      const parsedDate = new Date(dateStr)
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate
        break
      }
    }
  }

  let sender: string | null = null
  for (const pattern of senderPatterns) {
    const match = text.match(pattern)
    if (match) {
      const parsedSender = match[1].trim()
      // Exclude generic platform words
      if (parsedSender && !/transaction|transfer|receipt|payment|bank|success/i.test(parsedSender)) {
        sender = parsedSender
        break
      }
    }
  }
  
  return { amount, date, sender }
}
