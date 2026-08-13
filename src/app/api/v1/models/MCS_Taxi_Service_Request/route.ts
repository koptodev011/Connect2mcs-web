import { NextRequest, NextResponse } from 'next/server'
import { fetchModelRecord, getAuthToken } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'
const MODEL = 'MCS_Taxi_Service_Request'
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
    const scope = request.nextUrl.searchParams.get('scope')
    if (scope === 'driver' || scope === 'completed') {
      const driver = (await read('MCS_TaxiDriver', `AD_User_ID eq ${userId} and IsActive eq true`, 'C_City_ID,AD_User_ID', 1))[0]
      if (!driver) return NextResponse.json({ error: 'A taxi driver profile is required.' }, { status: 403 })
      const driverId = idOf(driver.id)
      if (scope === 'completed') {
        const quotes = await read('MCS_Taxi_Service_Quote', `MCS_TaxiDriver_ID eq ${driverId} and MCS_Status eq 'A' and IsActive eq true`, 'MCS_Taxi_Service_Request_ID')
        const requestIds = quotes.map((quote: Record<string, unknown>) => idOf(quote.MCS_Taxi_Service_Request_ID)).filter(Boolean)
        if (!requestIds.length) return NextResponse.json({ records: [] })
        const completedFilter = `(${requestIds.map((id: number) => `MCS_Taxi_Service_Request_ID eq ${id}`).join(' or ')}) and MCS_TripStatus eq 'C' and IsActive eq true`
        const records = await read(MODEL, completedFilter, 'AD_User_ID,C_Country_ID,C_City_ID')
        return NextResponse.json({ records })
      }
      const cityId = idOf(driver.C_City_ID)
      if (!cityId) return NextResponse.json({ records: [], city: null })
      const records = await read(MODEL, `C_City_ID eq ${cityId} and MCS_TripStatus eq 'O' and IsActive eq true`, 'AD_User_ID,C_Country_ID,C_City_ID')
      return NextResponse.json({ records, city: driver.C_City_ID })
    }
    const records = await read(MODEL, `AD_User_ID eq ${userId} and IsActive eq true`, 'AD_User_ID,C_Country_ID,C_City_ID')
    return NextResponse.json({ records })
  } catch (error) {
    console.error('Taxi requests fetch failed:', error)
    return NextResponse.json({ error: 'Could not load taxi requests', detail: error instanceof Error ? error.message : 'Unknown backend error' }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    const userId = sessionUser(request, idOf(input.AD_User_ID || input.userId))
    if (!userId) return NextResponse.json({ error: 'Unauthorized taxi user' }, { status: 401 })
    const pickup = String(input.MCS_Pickup || '').trim()
    const drop = String(input.MCS_Drop || '').trim()
    const passengers = Number(input.MCS_PassengerCount)
    const tripDate = new Date(String(input.MCS_TripDate || ''))
    if (!pickup || !drop || !Number.isInteger(passengers) || passengers < 1 || passengers > 20 || Number.isNaN(tripDate.getTime())) return NextResponse.json({ error: 'Enter a valid pickup, destination, trip date, and passenger count.' }, { status: 400 })
    const payload: Record<string, unknown> = { AD_Org_ID: { id: Number(process.env.IDEMPIERE_ORG_ID) || 1000012 }, AD_User_ID: { id: userId }, Name: 'Taxi Service Request', Description: String(input.Description || 'Taxi trip request created from web').trim(), MCS_Pickup: pickup, MCS_Drop: drop, MCS_PassengerCount: passengers, MCS_TripDate: tripDate.toISOString().replace(/\.\d{3}Z$/, 'Z'), MCS_TripStatus: 'O', MCS_UserQuote: Math.max(Number(input.MCS_UserQuote) || 0, 0), IsActive: true }
    if (idOf(input.C_Country_ID)) payload.C_Country_ID = { id: idOf(input.C_Country_ID) }
    if (idOf(input.C_City_ID)) payload.C_City_ID = { id: idOf(input.C_City_ID) }
    const created = await write(MODEL, 'POST', payload)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Taxi request create failed:', error)
    return NextResponse.json({ error: 'Could not create taxi request', detail: error instanceof Error ? error.message : 'Unknown backend error' }, { status: 500 })
  }
}
export async function PUT(request: NextRequest) {
  try {
    const input = await request.json()
    const userId = sessionUser(request, idOf(input.AD_User_ID || input.userId))
    const requestId = idOf(input.MCS_Taxi_Service_Request_ID || input.id)
    if (!userId) return NextResponse.json({ error: 'Unauthorized taxi user' }, { status: 401 })
    if (!requestId) return NextResponse.json({ error: 'Invalid taxi request.' }, { status: 400 })
    const existing = await fetchModelRecord(MODEL, requestId)
    if (idOf(existing.AD_User_ID) !== userId) return NextResponse.json({ error: 'Taxi request does not belong to this user' }, { status: 403 })
    const status = String(input.MCS_TripStatus || '')
    if (!['A', 'C', 'X'].includes(status)) return NextResponse.json({ error: 'Invalid trip status.' }, { status: 400 })
    const quoteId = idOf(input.MCS_Taxi_Service_Quote_ID || input.quoteId)
    if (status === 'A') {
      if (!quoteId) return NextResponse.json({ error: 'A taxi quote is required to book a driver.' }, { status: 400 })
      const quote = await fetchModelRecord('MCS_Taxi_Service_Quote', quoteId)
      if (idOf(quote.MCS_Taxi_Service_Request_ID) !== requestId) return NextResponse.json({ error: 'Taxi quote does not belong to this request' }, { status: 403 })
      await write(`MCS_Taxi_Service_Quote/${quoteId}`, 'PUT', { MCS_Status: 'A', IsActive: true })
    }
    const updated = await write(`${MODEL}/${requestId}`, 'PUT', { MCS_TripStatus: status, MCS_UserQuote: Math.max(Number(input.MCS_UserQuote) || 0, 0), IsActive: true })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Taxi request update failed:', error)
    return NextResponse.json({ error: 'Could not update taxi request', detail: error instanceof Error ? error.message : 'Unknown backend error' }, { status: 500 })
  }
}
