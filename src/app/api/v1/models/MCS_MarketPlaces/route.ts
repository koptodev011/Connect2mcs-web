import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'
import {
  countTodayPosts,
  DAILY_POST_LIMIT,
  loginTypeOf,
  RESTRICTED_LOGIN_TYPES,
} from '@/lib/marketplace-limit'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'
const MODEL = 'MCS_MarketPlaces'

const CONDITION_CODES: Record<string, string> = {
  'New': 'N',
  'Like new': 'LN',
  'Good': 'G',
  'Used': 'U',
}

const idOf = (value: unknown): number =>
  Number(value && typeof value === 'object' && 'id' in value
    ? (value as { id: unknown }).id
    : value) || 0

function sessionUser(request: NextRequest, requestedUserId: number) {
  const verifiedUserId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
  return verifiedUserId === requestedUserId ? verifiedUserId : null
}

function normalizeDate(value: unknown, fallback: string): string {
  const date = new Date(String(value || ''))
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

async function write(path: string, method: 'POST' | 'PUT', body: unknown) {
  const response = await fetch(`${API_URL}/models/${path}`, {
    method,
    headers: { Authorization: `Bearer ${await getAuthToken()}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${text}`)
  return text ? JSON.parse(text) : null
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    const userId = sessionUser(request, idOf(input.MCS_PostedBy_ID ?? input.userId))
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized marketplace user' }, { status: 401 })
    }

    const name = String(input.Name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'A listing Name is required' }, { status: 400 })
    }

    const loginType = await loginTypeOf(userId)
    if (RESTRICTED_LOGIN_TYPES.includes(loginType)) {
      const todayCount = await countTodayPosts(userId)
      if (todayCount >= DAILY_POST_LIMIT) {
        return NextResponse.json(
          { error: `You have reached the daily limit of ${DAILY_POST_LIMIT} listings. Please try again tomorrow.`, todayCount },
          { status: 429 },
        )
      }
    }

    const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const category = input.MCS_MarketPlace_Category_ID
    const logo = input.MCS_Logo_ID

    const payload: Record<string, unknown> = {
      AD_Org_ID: { id: Number(process.env.IDEMPIERE_ORG_ID) || 1000012 },
      AD_User_ID: { id: userId },
      Name: name,
      Value: String(input.Value ?? name),
      MCS_PostedBy_ID: { id: userId },
      Description: String(input.Description || ''),
      Location: String(input.Location || ''),
      MCS_Condition: CONDITION_CODES[String(input.MCS_Condition ?? '')] || String(input.MCS_Condition ?? '') || 'U',
      MCS_StartDate: normalizeDate(input.MCS_StartDate, now),
      MCS_EndDate: normalizeDate(input.MCS_EndDate, now),
      MCS_IsFeatured: input.MCS_IsFeatured === true,
      IsSold: input.IsSold === true,
      IsActive: input.IsActive !== false,
      MCS_AdType: input.MCS_AdType === 'Business' ? 'B' : 'P',
      MCS_Status: input.MCS_Status === 'SD' ? 'SD' : 'PB',
      MCS_QTY: Number(input.qty ?? input.MCS_QTY) || 1,
    }

    const currencyId = idOf(input.C_Currency_ID)
    if (currencyId) payload.C_Currency_ID = { id: currencyId }

    const priceRaw = String(input.Price ?? '')
    const price = Number(priceRaw)
    if (priceRaw.trim() !== '' && !Number.isNaN(price)) {
      payload.Price = price
    }

    const cityId = idOf(input.C_City_ID)
    if (cityId) payload.C_City_ID = { id: cityId }

    const countryId = idOf(input.C_Country_ID)
    if (countryId) payload.C_Country_ID = { id: countryId }

    const categoryId = idOf(category)
    if (categoryId) {
      const identifier = typeof category === 'object' && category !== null
        ? String((category as { identifier?: unknown }).identifier || '')
        : ''
      payload.MCS_MarketPlace_Category_ID = { id: categoryId, identifier }
    }

    const logoData = typeof logo === 'object' && logo !== null
      ? String((logo as { data?: unknown }).data || '')
      : ''
    const logold = idOf(logo)
    if (logoData) {
      payload.MCS_Logo_ID = { data: logoData, name: String((logo as { name?: unknown }).name || 'Listing image') }
    } else if (logold) {
      payload.MCS_Logo_ID = { id: logold }
    }

    const created = await write(MODEL, 'POST', payload)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Marketplace listing create failed:', error)
    return NextResponse.json(
      { error: 'Could not create marketplace listing', detail: error instanceof Error ? error.message : 'Unknown backend error' },
      { status: 500 },
    )
  }
}