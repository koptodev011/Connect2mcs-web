import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'
const MODEL = 'MCS_Taxi_Service_Quote'
const idOf = (value: unknown): number => Number(value && typeof value === 'object' && 'id' in value ? (value as { id: unknown }).id : value) || 0
const sessionUser = (request: NextRequest, requested: number) => {
  const verified = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
  return verified === requested ? verified : null
}
async function read(model: string, filter: string, expand = '', top = 100, orderby = 'Created desc') {
  const query = new URLSearchParams({ '$filter': filter, '$orderby': orderby, '$top': String(top) })
  if (expand) query.set('$expand', expand)
  const response = await fetch(`${API_URL}/models/${model}?${query.toString()}`, { headers: { Authorization: `Bearer ${await getAuthToken()}`, Accept: 'application/json' }, cache: 'no-store' })
  const text = await response.text()
  if (!response.ok) throw new Error(`GET ${model}: ${response.status} ${text}`)
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
    if (!userId) return NextResponse.json({ error: 'Unauthorized taxi user' }, { status: 401 })
    const requests = await read('MCS_Taxi_Service_Request', `AD_User_ID eq ${userId} and IsActive eq true`)
    const requestIds = requests.map((record: Record<string, unknown>) => idOf(record.id)).filter(Boolean)
    if (!requestIds.length) return NextResponse.json({ records: [] })
    const filter = `(${requestIds.map((id: number) => `MCS_Taxi_Service_Request_ID eq ${id}`).join(' or ')}) and IsActive eq true`
    const records = await read(MODEL, filter, 'MCS_TaxiDriver_ID,MCS_Taxi_Service_Request_ID,C_Currency_ID')
    return NextResponse.json({ records })
  } catch (error) {
    console.error('Taxi quotes fetch failed:', error)
    return NextResponse.json({ error: 'Could not load taxi quotes', detail: error instanceof Error ? error.message : 'Unknown backend error' }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    const userId = sessionUser(request, idOf(input.AD_User_ID || input.userId))
    if (!userId) return NextResponse.json({ error: 'Unauthorized taxi user' }, { status: 401 })
    const requestId = idOf(input.MCS_Taxi_Service_Request_ID || input.requestId)
    const fare = Number(input.MCS_QuotedFare)
    if (!requestId || !Number.isFinite(fare) || fare <= 0) return NextResponse.json({ error: 'A valid request and fare are required.' }, { status: 400 })
    const driver = (await read('MCS_TaxiDriver', `AD_User_ID eq ${userId} and IsActive eq true`, '', 1))[0]
    if (!driver?.id) return NextResponse.json({ error: 'Create a taxi driver profile before sending quotes.' }, { status: 403 })
    const quoteDate = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const payload = { AD_Org_ID: { id: Number(process.env.IDEMPIERE_ORG_ID) || 1000012 }, C_Currency_ID: { id: idOf(input.C_Currency_ID || input.currencyId) || 100 }, MCS_Taxi_Service_Request_ID: { id: requestId }, MCS_TaxiDriver_ID: { id: idOf(driver.id) }, Name: String(input.Name || driver.AD_User_ID?.identifier || 'Taxi Driver'), Description: String(input.Description || 'Taxi quote created from web'), MCS_QuoteDate: quoteDate, MCS_QuotedFare: fare, MCS_Status: 'S', IsActive: true }
    const created = await write(MODEL, 'POST', payload)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Taxi quote create failed:', error)
    return NextResponse.json({ error: 'Could not create taxi quote', detail: error instanceof Error ? error.message : 'Unknown backend error' }, { status: 500 })
  }
}