import { NextRequest, NextResponse } from 'next/server'
import { fetchModelRecord, getAuthToken } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'

type Reference = { id?: number | string }
type MentorRecord = { AD_User_ID?: Reference | number | string }

function referenceId(value: Reference | number | string | undefined) {
  return Number(typeof value === 'object' && value !== null ? value.id : value)
}

async function authorizeOwner(request: NextRequest, mentorId: number) {
  const signedUserId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
  if (!signedUserId) {
    return { error: NextResponse.json({ error: 'Please sign in again.' }, { status: 401 }) }
  }
  const mentor = (await fetchModelRecord('MCS_Mentor', mentorId)) as MentorRecord
  if (referenceId(mentor.AD_User_ID) !== signedUserId) {
    return {
      error: NextResponse.json(
        { error: 'You can only change the mentor profile you created.' },
        { status: 403 },
      ),
    }
  }
  return { signedUserId }
}

async function upstream(method: 'PUT' | 'DELETE', mentorId: number, body?: unknown) {
  const response = await fetch(`${API_URL}/models/MCS_Mentor/${mentorId}`, {
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
  try {
    data = text ? JSON.parse(text) : {}
  } catch {}
  if (!response.ok) {
    return {
      error: NextResponse.json(
        {
          error: String(
            data.message || data.error || text || `iDempiere returned ${response.status}`,
          ),
        },
        { status: response.status },
      ),
    }
  }
  return { data }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const mentorId = Number((await context.params).id)
    if (!mentorId) {
      return NextResponse.json({ error: 'Invalid mentor ID' }, { status: 400 })
    }

    const authorization = await authorizeOwner(request, mentorId)
    if (authorization.error) return authorization.error

    const input = await request.json()
    const categoryId = Number(input.MCS_Mentorship_Category_ID?.id || input.MCS_Mentorship_Category_ID)
    const currencyId = Number(input.C_Currency_ID?.id || input.C_Currency_ID)
    if (!String(input.Name || '').trim()) {
      return NextResponse.json({ error: 'Mentor name is required' }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ error: 'Mentorship category is required' }, { status: 400 })
    }
    if (!currencyId) {
      return NextResponse.json({ error: 'Currency is required' }, { status: 400 })
    }

    const payload = {
      AD_User_ID: authorization.signedUserId,
      C_Currency_ID: currencyId,
      MCS_Mentorship_Category_ID: categoryId,
      Name: String(input.Name).trim(),
      Description: String(input.Description || '').trim(),
      MCS_Bio: String(input.MCS_Bio || '').trim(),
      MCS_Industry: String(input.MCS_Industry || '').trim(),
      MCS_SessionRate: Number(input.MCS_SessionRate) || 0,
      MCS_YearsExperience: Number(input.MCS_YearsExperience) || 0,
      IsActive: true,
      MCS_Designation: String(input.MCS_Designation || '').trim(),
      MCS_CompanyName: String(input.MCS_CompanyName || '').trim(),
      MCS_Languages: String(input.MCS_Languages || '').trim(),
    }

    const result = await upstream('PUT', mentorId, payload)
    if (result.error) return result.error
    return NextResponse.json(result.data)
  } catch (error) {
    console.error('MCS_Mentor update failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Could not update mentor profile',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const mentorId = Number((await context.params).id)
    if (!mentorId) {
      return NextResponse.json({ error: 'Invalid mentor ID' }, { status: 400 })
    }
    const authorization = await authorizeOwner(request, mentorId)
    if (authorization.error) return authorization.error
    const result = await upstream('DELETE', mentorId)
    if (result.error) return result.error
    return NextResponse.json({ success: true, id: mentorId })
  } catch (error) {
    console.error('MCS_Mentor delete failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Could not delete mentor profile',
      },
      { status: 500 },
    )
  }
}