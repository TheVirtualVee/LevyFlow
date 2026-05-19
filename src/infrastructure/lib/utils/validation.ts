/**
 * Validates a student matriculation number against a specific school pattern.
 * If no pattern is provided, defaults to basic alphanumeric check.
 */
export function validateMatricNumber(matric: string, pattern?: string | null): boolean {
  if (!matric) return false
  const trimmed = matric.trim()
  
  if (pattern) {
    try {
      const regex = new RegExp(pattern, 'i')
      return regex.test(trimmed)
    } catch (e) {
    }
  }

  return /^[a-z0-9\/\-_]{5,20}$/i.test(trimmed)
}

/**
 * Validates standard contact info format (either email or Nigerian phone number).
 */
export function validateContactInfo(contact: string): boolean {
  if (!contact) return false
  const trimmed = contact.trim()

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^(?:\+234|0)[789][01]\d{8}$/

  return emailRegex.test(trimmed) || phoneRegex.test(trimmed)
}
