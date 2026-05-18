import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function md5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex')
}

export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}
