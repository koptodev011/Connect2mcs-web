import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'
const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'
async function owned(request: NextRequest, id: string) {
  const userId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
  if (!userId) return null
  const token = await getAuthToken()
  const mentorFilter = encodeURIComponent(`AD_User_ID eq ${userId} and IsActive eq true`)
  const mentorResponse = await fetch(`${API_URL}/models/MCS_Mentor?$filter=${mentorFilter}&$top=1`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  const mentorData = mentorResponse.ok ? await mentorResponse.json() as { records?: Array<{ id?: number }> } : {}
  const webinarResponse = await fetch(`${API_URL}/models/MCS_MentorWebinar/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  const webinar = webinarResponse.ok ? await webinarResponse.json() as { MCS_Mentor_ID?: { id?: number } } : {}
  return Number(mentorData.records?.[0]?.id) && Number(mentorData.records?.[0]?.id) === Number(webinar.MCS_Mentor_ID?.id) ? token : null
}
async function proxy(request: NextRequest, id: string, method: 'PUT' | 'DELETE') {
  try {
    const token = await owned(request, id)
    if (!token) return NextResponse.json({ error: 'You can only modify webinars you created' }, { status: 403 })
    const response = await fetch(`${API_URL}/models/MCS_MentorWebinar/${id}`, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(method === 'PUT' ? { 'Content-Type': 'application/json' } : {}) }, body: method === 'PUT' ? JSON.stringify(await request.json()) : undefined, cache: 'no-store' })
    const text = await response.text(); let data: Record<string, unknown> = {}; try { data = text ? JSON.parse(text) : {} } catch {}
    return response.ok ? NextResponse.json(data, { status: response.status }) : NextResponse.json({ error: String(data.message || data.error || text) }, { status: response.status })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not modify webinar' }, { status: 500 }) }
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return proxy(request, (await params).id, 'PUT') }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return proxy(request, (await params).id, 'DELETE') }
