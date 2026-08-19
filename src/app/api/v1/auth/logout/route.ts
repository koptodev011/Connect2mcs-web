import { NextResponse } from 'next/server';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization');

  if (!authorization) {
    return NextResponse.json({ error: 'Authorization token is required' }, { status: 401 });
  }

  try {
    const token = authorization.replace(/^Bearer\s+/i, '');
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({ token }),
    });

    const body = await response.text();
    const logoutResponse = new NextResponse(body || null, {
      status: response.status,
      headers: body
        ? { 'Content-Type': response.headers.get('content-type') || 'application/json' }
        : undefined,
    });

    logoutResponse.cookies.delete('mcs_favorite_user');

    return logoutResponse;
  } catch (error) {
    console.error('Logout API connection error:', error);
    return NextResponse.json(
      { error: 'Unable to connect to the authentication service' },
      { status: 502 },
    );
  }
}
