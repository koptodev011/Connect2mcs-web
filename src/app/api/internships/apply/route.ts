import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
}

function getUserId(token: string) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as Record<string, unknown>;
    return payload.AD_User_ID ?? payload.userId ?? payload.user_id;
  } catch {
    return null;
  }
}

async function idempiereFetch(path: string, token: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: 'no-store',
  });
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    const userId = getUserId(token);
    if (!token || userId == null) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { internshipId } = await request.json();
    if (!internshipId) {
      return NextResponse.json({ error: 'Internship is required' }, { status: 400 });
    }

    const [userResponse, internshipResponse] = await Promise.all([
      idempiereFetch(`/models/AD_User/${encodeURIComponent(String(userId))}`, token),
      idempiereFetch(`/models/MCS_Internship/${encodeURIComponent(String(internshipId))}`, token),
    ]);
    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Logged-in user profile was not found' }, { status: 404 });
    }
    if (!internshipResponse.ok) {
      return NextResponse.json({ error: 'Internship was not found' }, { status: 404 });
    }

    const user = await userResponse.json();
    const internship = await internshipResponse.json();
    const payload = {
      AD_User_ID: { id: Number(user.id) },
      MCS_Internship_ID: { id: Number(internship.id) },
      IsActive: true,
    };

    const response = await idempiereFetch('/models/MCS_Internship_Applicants', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const responseText = await response.text();
    if (!response.ok) {
      console.error('Internship application API failed:', response.status, responseText);
      let upstreamError = 'Could not submit internship application';
      try {
        const parsed = JSON.parse(responseText);
        upstreamError = String(parsed.message || parsed.error || upstreamError);
      } catch {
        if (responseText.trim()) upstreamError = responseText.trim();
      }
      return NextResponse.json({ error: upstreamError }, { status: response.status });
    }

    let result: unknown = { success: true };
    if (responseText) {
      try { result = JSON.parse(responseText); } catch { result = { success: true }; }
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Internship application failed:', error);
    return NextResponse.json({ error: 'Could not submit internship application' }, { status: 500 });
  }
}