import { NextRequest, NextResponse } from 'next/server'
import { fetchModelRecord, getAuthToken } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'
import { verifyOfferClaimToken } from '@/lib/offer-claim-token'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'
type Reference = { id?: number | string }
type OfferRecord = { IsActive?: boolean; AD_User_ID?: Reference | number | string }

function referenceId(value: Reference | number | string | undefined) {
  return Number(typeof value === 'object' && value !== null ? value.id : value)
}

export async function POST(request: NextRequest) {
  try {
    const userId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
    if (!userId) return NextResponse.json({ error: 'Please sign in to claim this offer.' }, { status: 401 })

    const input = await request.json()
    const offerId = Number(input.MCS_Offers_ID ?? input.offerId)
    if (!offerId) return NextResponse.json({ error: 'A valid offer is required.' }, { status: 400 })
    const claimToken = verifyOfferClaimToken(input.token)
    if (!claimToken || claimToken.offerId !== offerId) {
      return NextResponse.json({ error: 'This QR code is invalid or has expired. Ask the offer owner to generate a new one.' }, { status: 410 })
    }

    const offer = await fetchModelRecord('MCS_Offers', offerId) as OfferRecord
    if (offer.IsActive === false) return NextResponse.json({ error: 'This offer is no longer active.' }, { status: 410 })
    if (referenceId(offer.AD_User_ID) !== claimToken.ownerId) {
      return NextResponse.json({ error: 'This QR code no longer matches the offer owner.' }, { status: 410 })
    }
    if (referenceId(offer.AD_User_ID) === userId) {
      return NextResponse.json({ error: 'You cannot claim an offer you created.' }, { status: 403 })
    }

    const token = await getAuthToken()
    const filter = encodeURIComponent(`AD_User_ID eq ${userId} and MCS_Offers_ID eq ${offerId} and IsActive eq true`)
    const existingResponse = await fetch(`${API_URL}/models/MCS_OfferClaim?$filter=${filter}&$top=1`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!existingResponse.ok) {
      const detail = await existingResponse.text()
      throw new Error(`Could not check existing claims (${existingResponse.status}): ${detail}`)
    }
    const existing = (await existingResponse.json()).records || []
    if (existing.length) return NextResponse.json({ success: true, alreadyClaimed: true, claim: existing[0] })

    const response = await fetch(`${API_URL}/models/MCS_OfferClaim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ AD_User_ID: userId, MCS_Offers_ID: offerId }),
      cache: 'no-store',
    })
    const text = await response.text()
    let result: Record<string, unknown> = {}
    try { result = text ? JSON.parse(text) : {} } catch {}
    if (!response.ok) {
      const error = String(result.message || result.error || text || 'Could not claim offer')
      return NextResponse.json({ error }, { status: response.status })
    }
    return NextResponse.json({ success: true, alreadyClaimed: false, claim: result }, { status: 201 })
  } catch (error) {
    console.error('MCS_OfferClaim create failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not claim offer' }, { status: 500 })
  }
}