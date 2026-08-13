import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
}

function tokenUserId(token: string) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as Record<string, unknown>;
    return String(payload.AD_User_ID ?? payload.userId ?? payload.user_id ?? '');
  } catch {
    return '';
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id || tokenUserId(token) !== String(id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const response = await fetch(`${API_URL}/models/ad_user/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json({ error: 'Could not load user profile' }, { status: response.status });
    }

    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
    });
  } catch (error) {
    console.error('Loading AD user failed:', error);
    return NextResponse.json({ error: 'Could not load user profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id || tokenUserId(token) !== String(id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const input = await request.json() as Record<string, unknown>;
    const countryId = Number(input.C_Country_ID);
    const cityId = Number(input.C_City_ID);
    if (!countryId || !cityId) return NextResponse.json({ error: 'Country and city are required' }, { status: 400 });

    const response = await fetch(`${API_URL}/models/ad_user/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ C_Country_ID: countryId, C_City_ID: cityId }),
      cache: 'no-store',
    });
    const text = await response.text();
    if (!response.ok) return NextResponse.json({ error: 'Could not update user profile', detail: text }, { status: response.status });
    return new NextResponse(text || JSON.stringify({ success: true }), { status: response.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Updating AD user failed:', error);
    return NextResponse.json({ error: 'Could not update user profile' }, { status: 500 });
  }
}