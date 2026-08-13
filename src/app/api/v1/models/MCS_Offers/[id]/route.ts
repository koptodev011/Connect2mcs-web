import { NextRequest, NextResponse } from 'next/server'
import { fetchModelRecord, getAuthToken } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'
type Reference = { id?: number | string }
type OfferRecord = { AD_User_ID?: Reference | number | string }

function referenceId(value: Reference | number | string | undefined) {
  return Number(typeof value === 'object' && value !== null ? value.id : value)
}

async function authorizeOwner(request: NextRequest, offerId: number) {
  const signedUserId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
  if (!signedUserId) return { error: NextResponse.json({ error: 'Please sign in again.' }, { status: 401 }) }
  const offer = await fetchModelRecord('MCS_Offers', offerId) as OfferRecord
  if (referenceId(offer.AD_User_ID) !== signedUserId) {
    return { error: NextResponse.json({ error: 'You can only change offers you created.' }, { status: 403 }) }
  }
  return { signedUserId }
}

async function upstream(path: string, method: 'PUT' | 'DELETE', body?: unknown) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await getAuthToken()}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  const text = await response.text()
  let data: Record<string, unknown> = {}
  try { data = text ? JSON.parse(text) : {} } catch {}
  if (!response.ok) {
    const error = String(data.message || data.error || text || `iDempiere returned ${response.status}`)
    return { error: NextResponse.json({ error }, { status: response.status }) }
  }
  return { data }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const offerId = Number((await context.params).id)
    if (!offerId) return NextResponse.json({ error: 'Invalid offer ID' }, { status: 400 })
    const authorization = await authorizeOwner(request, offerId)
    if (authorization.error) return authorization.error

    const input = await request.json()
    const payload: Record<string, unknown> = {
      Name: input.Name,
      Description: input.Description,
      MCS_description: input.MCS_description,
      MCS_PromoCode: input.MCS_PromoCode,
      MCS_Savings: Number(input.MCS_Savings) || 0,
      MCS_TotalQuantity: Number(input.MCS_TotalQuantity) || 0,
      ValidFrom: input.ValidFrom,
      ValidTo: input.ValidTo,
      MCS_Offers_Category_ID: input.MCS_Offers_Category_ID,
      C_Country_ID: input.C_Country_ID,
      C_City_ID: input.C_City_ID,
      AD_User_ID: { id: authorization.signedUserId, identifier: String(authorization.signedUserId) },
    }
    if (Number(input.AD_Image_ID?.id)) payload.AD_Image_ID = input.AD_Image_ID
    const result = await upstream(`/models/MCS_Offers/${offerId}`, 'PUT', payload)
    if (result.error) return result.error
    return NextResponse.json(result.data)
  } catch (error) {
    console.error('MCS_Offers update failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update offer' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const offerId = Number((await context.params).id)
    if (!offerId) return NextResponse.json({ error: 'Invalid offer ID' }, { status: 400 })
    const authorization = await authorizeOwner(request, offerId)
    if (authorization.error) return authorization.error
    const result = await upstream(`/models/MCS_Offers/${offerId}`, 'DELETE')
    if (result.error) return result.error
    return NextResponse.json({ success: true, id: offerId })
  } catch (error) {
    console.error('MCS_Offers delete failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not delete offer' }, { status: 500 })
  }
}