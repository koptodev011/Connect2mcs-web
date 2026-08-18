import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, fetchModelRecord } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'
const MODEL = 'MCS_MarketPlaces'

const CONDITION_CODES: Record<string, string> = {
  New: 'N',
  'Like new': 'LN',
  Good: 'G',
  Used: 'U',
}

const idOf = (value: unknown): number =>
  Number(value && typeof value === 'object' && 'id' in value
    ? (value as { id: unknown }).id
    : value) || 0

function sessionUser(request: NextRequest) {
  return verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
}

function normalizeDate(value: unknown, fallback: string): string {
  const date = new Date(String(value || ''))
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

async function ownerOf(id: string): Promise<number> {
  const record = await fetchModelRecord(MODEL, id)
  return Number(record.MCS_PostedBy_ID?.id || record.AD_User_ID?.id || 0)
}

async function write(path: string, method: 'PUT' | 'DELETE', body?: unknown) {
  const response = await fetch(`${API_URL}/models/${path}`, {
    method,
    headers: { Authorization: `Bearer ${await getAuthToken()}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${text}`)
  return text ? JSON.parse(text) : null
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const userId = sessionUser(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const input = await request.json()
    if (idOf(input.AD_User_ID) && userId !== idOf(input.AD_User_ID)) {
      return NextResponse.json({ error: 'Not your listing' }, { status: 403 })
    }

    const owner = await ownerOf(id)
    if (!owner || owner !== userId) {
      return NextResponse.json({ error: 'Not your listing' }, { status: 403 })
    }

    const status = input.MCS_Status === 'SD' ? 'SD' : 'PB'
    const isSold = status === 'SD'
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

    const payload: Record<string, unknown> = {
      Name: String(input.Name || ''),
      Value: String(input.Name || ''),
      Description: String(input.Description || ''),
      Location: String(input.Location || ''),
      MCS_Condition: CONDITION_CODES[String(input.MCS_Condition ?? '')] || String(input.MCS_Condition ?? '') || 'U',
      MCS_AdType: input.MCS_AdType === 'Business' ? 'B' : 'P',
      MCS_Status: status,
      IsSold: isSold,
      MCS_QTY: Number(input.qty ?? input.MCS_QTY) || 1,
    }
    if (isSold) {
      payload.MCS_SoldDate = normalizeDate(input.MCS_SoldDate, now)
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

    const categoryId = idOf(input.MCS_MarketPlace_Category_ID)
    if (categoryId) payload.MCS_MarketPlace_Category_ID = { id: categoryId }

    if (input.MCS_Logo_ID && typeof input.MCS_Logo_ID === 'object' && input.MCS_Logo_ID.data) {
      payload.MCS_Logo_ID = input.MCS_Logo_ID
    }

    const updated = await write(`${MODEL}/${id}`, 'PUT', payload)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Marketplace listing update failed:', error)
    return NextResponse.json(
      { error: 'Could not update marketplace listing', detail: error instanceof Error ? error.message : 'Unknown backend error' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const userId = sessionUser(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const owner = await ownerOf(id)
    if (!owner || owner !== userId) {
      return NextResponse.json({ error: 'Not your listing' }, { status: 403 })
    }

    await write(`${MODEL}/${id}`, 'DELETE')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Marketplace listing delete failed:', error)
    return NextResponse.json(
      { error: 'Could not delete marketplace listing', detail: error instanceof Error ? error.message : 'Unknown backend error' },
      { status: 500 },
    )
  }
}