import { createHmac, timingSafeEqual } from 'node:crypto'

export const OFFER_QR_TTL_SECONDS = 10 * 60

type ClaimTokenPayload = { offerId: number; ownerId: number; expiresAt: number; nonce: string }

function secret() {
  const value = process.env.OFFER_CLAIM_SECRET || process.env.FAVORITE_SESSION_SECRET || process.env.IDEMPIERE_PASSWORD
  if (!value) throw new Error('Offer claim secret is not configured')
  return value
}

function signature(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function createOfferClaimToken(offerId: number, ownerId: number) {
  const data: ClaimTokenPayload = {
    offerId,
    ownerId,
    expiresAt: Math.floor(Date.now() / 1000) + OFFER_QR_TTL_SECONDS,
    nonce: crypto.randomUUID(),
  }
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url')
  return { token: `${payload}.${signature(payload)}`, expiresAt: data.expiresAt }
}

export function verifyOfferClaimToken(token?: string | null): ClaimTokenPayload | null {
  if (!token) return null
  const [payload, suppliedSignature] = token.split('.')
  if (!payload || !suppliedSignature) return null
  const expected = Buffer.from(signature(payload))
  const supplied = Buffer.from(suppliedSignature)
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as ClaimTokenPayload
    if (!data.offerId || !data.ownerId || !data.expiresAt || data.expiresAt <= Math.floor(Date.now() / 1000)) return null
    return data
  } catch {
    return null
  }
}