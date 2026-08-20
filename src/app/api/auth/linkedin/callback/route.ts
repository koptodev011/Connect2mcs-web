import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '77d1zppux6kaej';

const loginRedirect = (origin: string, status: 'success' | 'error', message?: string) => {
  const url = new URL('/login', origin);
  url.searchParams.set('linkedin', status);
  if (message) url.searchParams.set('message', message);
  return NextResponse.redirect(url);
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get('code');
  const returnedState = requestUrl.searchParams.get('state');
  const providerError = requestUrl.searchParams.get('error_description');
  const cookieStore = await cookies();
  const expectedState = cookieStore.get('mcs_linkedin_state')?.value;
  const verifier = cookieStore.get('mcs_linkedin_verifier')?.value;

  if (providerError) return loginRedirect(origin, 'error', providerError);
  if (!code || !returnedState || returnedState !== expectedState || !verifier) {
    return loginRedirect(origin, 'error', 'LinkedIn authorization validation failed.');
  }

  try {
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${origin}/api/auth/linkedin/callback`;
    const tokenBody: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    };
    if (process.env.LINKEDIN_CLIENT_SECRET) tokenBody.client_secret = process.env.LINKEDIN_CLIENT_SECRET;

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(tokenBody),
      cache: 'no-store',
    });
    if (!tokenResponse.ok) throw new Error(`LinkedIn token exchange failed (${tokenResponse.status}).`);
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) throw new Error('LinkedIn did not return an access token.');

    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: 'no-store',
    });
    if (!profileResponse.ok) throw new Error(`LinkedIn profile request failed (${profileResponse.status}).`);
    const profile = await profileResponse.json() as {
      sub?: string;
      name?: string;
      email?: string;
      picture?: string;
    };
    if (!profile.sub || !profile.email) throw new Error('LinkedIn account did not provide required profile and email data.');

    const response = loginRedirect(origin, 'success');
    response.cookies.set('mcs_linkedin_profile', Buffer.from(JSON.stringify(profile)).toString('base64url'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 2 * 60,
    });
    response.cookies.delete('mcs_linkedin_state');
    response.cookies.delete('mcs_linkedin_verifier');
    return response;
  } catch (error) {
    return loginRedirect(origin, 'error', error instanceof Error ? error.message : 'LinkedIn sign-in failed.');
  }
}
