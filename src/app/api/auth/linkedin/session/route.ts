import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const encodedProfile = cookieStore.get('mcs_linkedin_profile')?.value;
  if (!encodedProfile) return NextResponse.json({ error: 'LinkedIn session expired.' }, { status: 401 });

  try {
    const profile = JSON.parse(Buffer.from(encodedProfile, 'base64url').toString('utf8'));
    const response = NextResponse.json({ profile });
    response.cookies.delete('mcs_linkedin_profile');
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid LinkedIn session.' }, { status: 400 });
  }
}
