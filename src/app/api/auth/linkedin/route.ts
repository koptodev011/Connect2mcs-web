import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '77d1zppux6kaej';

const base64Url = (value: Buffer) => value.toString('base64url');

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${origin}/api/auth/linkedin/callback`;
  const state = base64Url(randomBytes(24));
  const verifier = base64Url(randomBytes(48));
  const challenge = base64Url(createHash('sha256').update(verifier).digest());
  const authorizationUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');

  authorizationUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    state,
    scope: 'openid profile email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 10 * 60,
  };
  response.cookies.set('mcs_linkedin_state', state, cookieOptions);
  response.cookies.set('mcs_linkedin_verifier', verifier, cookieOptions);
  return response;
}
