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

    const { name, description, MCS_Type = 'J' } = await request.json();
    if (!name?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    const userResponse = await idempiereFetch(
      `/models/AD_User/${encodeURIComponent(String(userId))}`,
      token,
    );
    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Logged-in user profile was not found' }, { status: 401 });
    }

    const user = await userResponse.json();
    const loginTypeValue = user.MCS_LoginType;
    const loginType = typeof loginTypeValue === 'object'
      ? String(loginTypeValue?.id || '')
      : String(loginTypeValue || '');
    if (!['E', 'J'].includes(loginType.toUpperCase())) {
      return NextResponse.json({ error: 'You do not have permission to post jobs' }, { status: 403 });
    }

    const payload = {
      Name: String(name).trim(),
      Description: String(description).trim(),
      MCS_Type: String(MCS_Type).trim() || 'J',
      AD_User_ID: {
        id: Number(user.id),
        identifier: String(user.Name || user.EMail || user.id),
      },
      IsActive: true,
    };

    const response = await idempiereFetch('/models/MCS_JobPosts', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const responseText = await response.text();
    if (!response.ok) {
      console.error('MCS_JobPosts API failed:', response.status, responseText);
      return NextResponse.json({ error: 'Could not post job' }, { status: response.status });
    }

    let result: unknown = { success: true };
    if (responseText) {
      try { result = JSON.parse(responseText); } catch { result = { success: true }; }
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Posting job failed:', error);
    return NextResponse.json({ error: 'Could not post job' }, { status: 500 });
  }
}
