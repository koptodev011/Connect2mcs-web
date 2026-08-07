import { NextRequest, NextResponse } from 'next/server'
import { fetchModelRecord, getAuthToken } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'
const MODEL = 'MCS_Aarati_Favorites'
const idOf = (v: unknown): number => Number(v && typeof v === 'object' && 'id' in v ? (v as { id: unknown }).id : v) || 0
const sessionUser = (r: NextRequest, requested: number) => {
  const verified = verifyFavoriteUser(r.cookies.get('mcs_favorite_user')?.value)
  return verified === requested ? verified : null
}
async function read(filter: string, top = 5, orderby = 'Created desc') {
  const query = new URLSearchParams({ '$filter': filter, '$orderby': orderby, '$top': String(top) })
  const response = await fetch(`${API_URL}/models/${MODEL}?${query.toString()}`, { headers: { Authorization: `Bearer ${await getAuthToken()}`, Accept: 'application/json' }, cache: 'no-store' })
  const text = await response.text()
  if (!response.ok) throw new Error(`GET ${MODEL}: ${response.status} ${text}`)
  const payload = text ? JSON.parse(text) : {}
  return Array.isArray(payload) ? payload : payload.records || []
}
async function write(path: string, method: 'POST' | 'PUT', body: unknown) {
  const response = await fetch(`${API_URL}/models/${path}`, { method, headers: { Authorization: `Bearer ${await getAuthToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' })
  const text = await response.text()
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${text}`)
  return text ? JSON.parse(text) : null
}
export async function GET(request: NextRequest) {
  try {
    const userId = sessionUser(request, Number(request.nextUrl.searchParams.get('userId')))
    if (!userId) return NextResponse.json({ error: 'Unauthorized favorite user' }, { status: 401 })
    const records = await read(`AD_User_ID eq ${userId} and IsActive eq true`, 5)
    return NextResponse.json({ favorites: records.map((r: Record<string, unknown>) => ({ id: r.id, aartiId: idOf(r.MCS_Aarati_ID) })).filter((r: { aartiId: number }) => r.aartiId) })
  } catch (error) {
    console.error('Aarti favorites fetch failed:', error)
    return NextResponse.json({ error: 'Could not load favorites' }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    const requested = idOf(input.AD_User_ID || input.userId)
    const userId = sessionUser(request, requested)
    const aartiId = idOf(input.MCS_Aarati_ID || input.aartiId)
    const favoriteId = idOf(input.MCS_Aarati_Favorites_ID || input.favoriteId)
    const active = typeof input.IsActive === 'boolean' ? input.IsActive : input.active
    if (!userId) return NextResponse.json({ error: 'Unauthorized favorite user' }, { status: 401 })
    if (!aartiId || typeof active !== 'boolean') return NextResponse.json({ error: 'aartiId and active are required' }, { status: 400 })
    if (favoriteId) {
      const favorite = await fetchModelRecord(MODEL, favoriteId)
      if (idOf(favorite.AD_User_ID) !== userId || idOf(favorite.MCS_Aarati_ID) !== aartiId) return NextResponse.json({ error: 'Favorite record does not belong to this user and Aarti' }, { status: 403 })
      const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
      await write(`${MODEL}/${favoriteId}`, 'PUT', { IsActive: active, FavoritedAt: timestamp })
      return NextResponse.json({ active, favoriteId })
    }
    const existing = (await read(`AD_User_ID eq ${userId} and MCS_Aarati_ID eq ${aartiId}`, 1))[0]
    const requestedDate = input.FavoritedAt ? new Date(input.FavoritedAt) : new Date()
    const favoritedAt = (Number.isNaN(requestedDate.getTime()) ? new Date() : requestedDate).toISOString().replace(/\.\d{3}Z$/, 'Z')
    if (existing) {
      await write(`${MODEL}/${existing.id}`, 'PUT', { IsActive: active, FavoritedAt: favoritedAt })
      return NextResponse.json({ active, favoriteId: existing.id })
    }
    if (!active) return NextResponse.json({ active: false })
    const created = await write(MODEL, 'POST', { MCS_Aarati_ID: { id: aartiId }, AD_User_ID: { id: userId }, FavoritedAt: favoritedAt, IsActive: true })
    return NextResponse.json({ active: true, favoriteId: created?.id || created?.MCS_Aarati_Favorites_ID }, { status: 201 })
  } catch (error) {
    console.error('Aarti favorite update failed:', error)
    return NextResponse.json({ error: 'Could not update favorite', detail: error instanceof Error ? error.message : 'Unknown backend error' }, { status: 500 })
  }
}
