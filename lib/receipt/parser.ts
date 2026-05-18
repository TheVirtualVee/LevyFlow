interface ReceiptData {
  amount: number | null
  date: Date | null
  sender: string | null
}

export function extractReceiptData(text: string): ReceiptData {
  if (!text) {
    return { amount: null, date: null, sender: null }
  }

  // Nigerian amount patterns matching ₦, N, NGN, Total, Amount
  const amountPatterns = [
    /N(?:GN)?\s?([\d,]+(?:\.\d{2})?)/i,
    /₦\s?([\d,]+(?:\.\d{2})?)/,
    /Amount:\s?([\d,]+(?:\.\d{2})?)/i,
    /Total:\s?([\d,]+(?:\.\d{2})?)/i,
    /([\d,]+(?:\.\d{2})?)\s?(?:NGN|Naira)/i
  ]
  
  // Date patterns matching DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
    /(\d{1,2})-(\d{1,2})-(\d{2,4})/,
    /(\d{4})-(\d{2})-(\d{2})/
  ]
  
  let amount: number | null = null
  for (const pattern of amountPatterns) {
    const match = text.match(pattern)
    if (match) {
      // Remove commas and parse float
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
      // In case DD/MM/YYYY needs sorting, try standard parsing first
      const dateStr = match[0]
      const parsedDate = new Date(dateStr)
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate
        break
      }
    }
  }
  
  return { amount, date, sender: null }
}
