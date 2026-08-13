import { NextRequest, NextResponse } from 'next/server'
import { fetchModelRecord } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'
import { createOfferClaimToken } from '@/lib/offer-claim-token'

type Reference = { id?: number | string }
type OfferRecord = { AD_User_ID?: Reference | number | string; IsActive?: boolean }

function referenceId(value: Reference | number | string | undefined) {
  return Number(typeof value === 'object' && value !== null ? value.id : value)
}

export async function POST(request: NextRequest) {
  try {
    const ownerId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
    if (!ownerId) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
    const { offerId: inputOfferId } = await request.json()
    const offerId = Number(inputOfferId)
    if (!offerId) return NextResponse.json({ error: 'A valid offer is required.' }, { status: 400 })

    const offer = await fetchModelRecord('MCS_Offers', offerId) as OfferRecord
    if (offer.IsActive === false) return NextResponse.json({ error: 'This offer is inactive.' }, { status: 410 })
    if (referenceId(offer.AD_User_ID) !== ownerId) {
      return NextResponse.json({ error: 'You can only generate QR codes for offers you created.' }, { status: 403 })
    }

    const { token, expiresAt } = createOfferClaimToken(offerId, ownerId)
    const claimUrl = `${request.nextUrl.origin}/offers/claim/${offerId}?token=${encodeURIComponent(token)}`
    return NextResponse.json({ claimUrl, expiresAt: expiresAt * 1000 })
  } catch (error) {
    console.error('Offer claim QR generation failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not generate claim QR' }, { status: 500 })
  }
}