import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'
const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'
type Ref = { id?: number; identifier?: string }
type Webinar = { id?: number; Name?: string; Description?: string; Help?: string; MCS_Mentor_ID?: Ref; MCS_Topic?: string; URL?: string; MCS_WebinarURL?: string; JoinURL?: string; MCS_StartDate?: string; MCS_time?: string; MCS_TimeZone?: string; MCS_IsPaid?: boolean; Price?: number; C_Currency_ID?: Ref; AD_Image_ID?: Ref; MCS_Status?: Ref | string }
async function context(request: NextRequest) {
  const userId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
  const token = await getAuthToken()
  if (!userId) return { userId: 0, mentorId: 0, token }
  const filter = encodeURIComponent(`AD_User_ID eq ${userId} and IsActive eq true`)
  const response = await fetch(`${API_URL}/models/MCS_Mentor?$filter=${filter}&$top=1`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' })
  const data = response.ok ? await response.json() as { records?: Array<{ id?: number }> } : {}
  return { userId, mentorId: Number(data.records?.[0]?.id), token }
}
const statusCode = (value: Ref | string | undefined) => String(typeof value === 'object' ? value.id || value.identifier || '' : value || '').toUpperCase()
export async function GET(request: NextRequest) {
  try {
    const { mentorId, token } = await context(request)
    const query = new URLSearchParams({ '$filter': 'IsActive eq true', '$top': '100', '$orderby': 'MCS_StartDate' })
    const response = await fetch(`${API_URL}/models/MCS_MentorWebinar?${query.toString()}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' })
    const data = response.ok ? await response.json() as { records?: Webinar[] } : { records: [] }
    const records = (data.records || []).filter(record => statusCode(record.MCS_Status) === 'P' || Number(record.MCS_Mentor_ID?.id) === mentorId).map(record => ({
      id: String(record.id), title: record.Name || 'Mentor webinar', description: record.Description || '', help: record.Help || '',
      mentorId: String(record.MCS_Mentor_ID?.id || ''), mentorName: record.MCS_Mentor_ID?.identifier || 'MCS Mentor',
      date: record.MCS_StartDate || '', time: record.MCS_time || '', timeZone: record.MCS_TimeZone || '', paid: record.MCS_IsPaid === true,
      price: Number(record.Price || 0), currency: record.C_Currency_ID?.identifier || '', currencyId: String(record.C_Currency_ID?.id || ''),
      imageId: String(record.AD_Image_ID?.id || ''), registrationUrl: record.URL || record.MCS_WebinarURL || record.JoinURL || '', topic: record.MCS_Topic || 'Mentorship', status: typeof record.MCS_Status === 'object' ? record.MCS_Status.identifier || statusCode(record.MCS_Status) : statusCode(record.MCS_Status), statusCode: statusCode(record.MCS_Status),
    }))
    return NextResponse.json(records)
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load webinars' }, { status: 500 }) }
}
export async function POST(request: NextRequest) {
  try {
    const input = await request.json(); const status = String(input.MCS_Status || '').toUpperCase()
    if (!String(input.Name || '').trim() || !String(input.MCS_Topic || '').trim() || !input.MCS_StartDate) return NextResponse.json({ error: 'Name, topic and start date are required' }, { status: 400 })
    if (!['D', 'P', 'C'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    if (input.MCS_IsPaid && (!Number(input.Price) || !Number(input.C_Currency_ID?.id))) return NextResponse.json({ error: 'Price and currency are required' }, { status: 400 })
    const { userId, mentorId, token } = await context(request)
    if (!userId || !mentorId) return NextResponse.json({ error: 'Only active mentors can create webinars' }, { status: 403 })
    const payload = { ...input, MCS_Mentor_ID: { id: mentorId }, MCS_Status: status, IsActive: true }
    if (!Number(payload.AD_Image_ID?.id)) delete payload.AD_Image_ID
    if (!Number(payload.C_Currency_ID?.id)) delete payload.C_Currency_ID
    const response = await fetch(`${API_URL}/models/MCS_MentorWebinar`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
    const text = await response.text(); let data: Record<string, unknown> = {}; try { data = text ? JSON.parse(text) : {} } catch {}
    return response.ok ? NextResponse.json(data, { status: response.status }) : NextResponse.json({ error: String(data.message || data.error || text) }, { status: response.status })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create webinar' }, { status: 500 }) }
}
