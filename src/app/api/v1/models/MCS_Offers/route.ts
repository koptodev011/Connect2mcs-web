import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'

type CountryReference = { identifier?: string; Name?: string }
type OfferRecord = {
  C_Country_ID?: CountryReference | string
  Country?: CountryReference | string
  MCS_Country?: string
}

function normalizeCountry(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[.]/g, '')
  const aliases: Record<string, string> = {
    usa: 'united states',
    'united states of america': 'united states',
    uk: 'united kingdom',
    uae: 'united arab emirates',
  }
  return aliases[normalized] || normalized
}

function getOfferCountry(record: OfferRecord) {
  const reference = record.C_Country_ID ?? record.Country
  if (typeof reference === 'string') return reference
  return reference?.identifier || reference?.Name || record.MCS_Country || ''
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSize = Math.min(Math.max(Number(searchParams.get('top')) || 6, 1), 50)
    const skipRecords = Math.max(Number(searchParams.get('skip')) || 0, 0)
    const cookieHeader = request.headers.get('cookie') || ''
    const countryCookie = cookieHeader
      .split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith('mcs_country='))
    const selectedCountry = countryCookie
      ? decodeURIComponent(countryCookie.substring('mcs_country='.length))
      : 'All'

    const query = new URLSearchParams({
      '$filter': 'IsActive eq true',
      '$top': '100',
      '$orderby': 'Created desc',
    })
    const offersResponse = await fetch(`${API_URL}/models/MCS_Offers?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })
    const offersText = await offersResponse.text()
    if (!offersResponse.ok) throw new Error(`MCS_Offers fetch failed (${offersResponse.status}): ${offersText}`)
    const allRecords = offersText ? (JSON.parse(offersText).records || []) : []
    const wantedCountry = normalizeCountry(selectedCountry)
    const filteredRecords = selectedCountry === 'All'
      ? allRecords
      : allRecords.filter((record: OfferRecord) => normalizeCountry(getOfferCountry(record)) === wantedCountry)
    const records = filteredRecords.slice(skipRecords, skipRecords + pageSize)

    return NextResponse.json({
      'page-count': Math.ceil(filteredRecords.length / pageSize),
      'records-size': records.length,
      'skip-records': skipRecords,
      'row-count': filteredRecords.length,
      'array-count': 0,
      country: selectedCountry,
      records,
    })
  } catch (error) {
    console.error('MCS_Offers fetch failed:', error)
    return NextResponse.json({ error: 'Could not load offers', records: [] }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    if (!payload.Name?.trim()) {
      return NextResponse.json({ error: 'Offer name is required' }, { status: 400 })
    }
    if (!payload.MCS_Offers_Category_ID?.id) {
      return NextResponse.json({ error: 'Offer category is required' }, { status: 400 })
    }
    if (!payload.ValidFrom || !payload.ValidTo) {
      return NextResponse.json({ error: 'Valid from and valid to dates are required' }, { status: 400 })
    }
    if (!payload.AD_User_ID) {
      return NextResponse.json({ error: 'A signed-in user is required' }, { status: 400 })
    }

    const signedUserId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
    const requestedUserId = Number(typeof payload.AD_User_ID === 'object' ? payload.AD_User_ID.id : payload.AD_User_ID)
    if (!signedUserId || signedUserId !== requestedUserId) {
      return NextResponse.json({ error: 'Your login session is invalid. Please sign in again.' }, { status: 403 })
    }
    const userId = signedUserId
    const createPayload = {
      ...payload,
      AD_User_ID: { id: userId, identifier: String(userId) },
      IsActive: true,
      MCS_IsNew: true,
      MCS_ClaimedCount: 0,
    }
    if (!Number(createPayload.AD_Image_ID?.id)) delete createPayload.AD_Image_ID
    if (!Number(createPayload.C_BPartner_ID?.id)) delete createPayload.C_BPartner_ID
    if (!Number(createPayload.MCS_Mandals_ID?.id)) delete createPayload.MCS_Mandals_ID

    const response = await fetch(`${API_URL}/models/MCS_Offers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPayload),
      cache: 'no-store',
    })
    const responseText = await response.text()
    let data: Record<string, unknown> = {}
    try { data = responseText ? JSON.parse(responseText) : {} } catch {}
    if (!response.ok) {
      console.error('MCS_Offers create failed:', response.status, responseText)
      const detail = String(data.message || data.error || responseText || `iDempiere returned ${response.status}`)
      return NextResponse.json({ error: detail, status: response.status }, { status: response.status })
    }
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('MCS_Offers create failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create offer' }, { status: 500 })
  }
}