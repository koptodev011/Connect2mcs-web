import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'

export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    const userId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
    if (!userId) return NextResponse.json({ error: 'Please sign in to become a mentor' }, { status: 403 })
    if (!String(input.Name || '').trim()) return NextResponse.json({ error: 'Mentor name is required' }, { status: 400 })
    if (!Number(input.MCS_Mentorship_Category_ID?.id)) return NextResponse.json({ error: 'Mentorship category is required' }, { status: 400 })
    if (!Number(input.C_Currency_ID?.id)) return NextResponse.json({ error: 'Currency is required' }, { status: 400 })

    const token = await getAuthToken()
    const duplicateFilter = encodeURIComponent(`AD_User_ID eq ${userId} and IsActive eq true`)
    const existingResponse = await fetch(`${API_URL}/models/MCS_Mentor?$filter=${duplicateFilter}&$top=1`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store',
    })
    const existingData = existingResponse.ok ? await existingResponse.json() as { records?: Array<{ id?: number }> } : {}
    if (existingData.records?.[0]?.id) return NextResponse.json({ error: 'You already have an active mentor profile' }, { status: 409 })

    const payload = {
      AD_User_ID: userId,
      C_Currency_ID: Number(input.C_Currency_ID.id),
      MCS_Mentorship_Category_ID: Number(input.MCS_Mentorship_Category_ID.id),
      Value: String(input.Name).trim(),
      Name: String(input.Name).trim(),
      Description: String(input.Description || '').trim(),
      MCS_Bio: String(input.MCS_Bio || '').trim(),
      MCS_Industry: String(input.MCS_Industry || '').trim(),
      MCS_IsVerified: false,
      MCS_SessionRate: Number(input.MCS_SessionRate) || 0,
      MCS_YearsExperience: Number(input.MCS_YearsExperience) || 0,
      IsActive: true,
      MCS_Designation: String(input.MCS_Designation || '').trim(),
      MCS_CompanyName: String(input.MCS_CompanyName || '').trim(),
      MCS_Languages: String(input.MCS_Languages || '').trim(),
    }
    const response = await fetch(`${API_URL}/models/MCS_Mentor`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const responseText = await response.text()
    let data: Record<string, unknown> = {}
    try { data = responseText ? JSON.parse(responseText) : {} } catch {}
    if (!response.ok) return NextResponse.json({ error: String(data.message || data.error || responseText || 'Could not create mentor profile') }, { status: response.status })
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create mentor profile' }, { status: 500 })
  }
}
