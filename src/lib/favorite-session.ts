import { createHmac, timingSafeEqual } from 'node:crypto'

function key() {
  const value = process.env.FAVORITE_SESSION_SECRET || process.env.IDEMPIERE_PASSWORD
  if (!value) throw new Error('Favorite session secret is not configured')
  return value
}
export function signFavoriteUser(userId: number) {
  const id = String(userId)
  return `${id}.${createHmac('sha256', key()).update(id).digest('hex')}`
}
export function verifyFavoriteUser(value?: string): number | null {
  if (!value) return null
  const [id, signature] = value.split('.')
  if (!/^\d+$/.test(id || '') || !signature) return null
  const expected = createHmac('sha256', key()).update(id).digest('hex')
  const supplied = Buffer.from(signature)
  const correct = Buffer.from(expected)
  return supplied.length === correct.length && timingSafeEqual(supplied, correct) ? Number(id) : null
}
