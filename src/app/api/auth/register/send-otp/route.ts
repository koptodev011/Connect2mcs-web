import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/idempiere';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';

type ProcessResponse = {
  isError?: boolean | string;
  summary?: string;
  detail?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const { email, name, phone } = await request.json();

    if (!email || !name || !phone) {
      return NextResponse.json({ error: 'Email, name, and phone are required' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const token = await getAuthToken();
    const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };

    const checkRes = await fetch(
      `${API_URL}/models/AD_User?$filter=${encodeURIComponent(`EMail eq '${normalizedEmail.replaceAll("'", "''")}'`)}`,
      { headers, cache: 'no-store' },
    );

    if (checkRes.ok) {
      const data = await checkRes.json();
      if ((data.records || []).length > 0) {
        return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
      }
    } else {
      console.warn(`Failed to check user existence: ${checkRes.status}`);
    }

    const otpRes = await fetch(`${API_URL}/processes/otpgenerateprocess`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ UserName: String(name).trim(), EMail: normalizedEmail, ResetPassword: 'N' }),
      cache: 'no-store',
    });

    const responseText = await otpRes.text();
    let otpData: ProcessResponse = {};
    try {
      otpData = responseText ? JSON.parse(responseText) as ProcessResponse : {};
    } catch {
      otpData = { message: responseText };
    }

    const processFailed = otpData.isError === true || String(otpData.isError).toLowerCase() === 'true';
    if (otpRes.ok && !processFailed) {
      return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    }

    console.error('OTP Generate Process Error:', otpData);
    return NextResponse.json(
      { error: otpData.detail || otpData.message || otpData.summary || 'Failed to send OTP' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Send OTP route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
