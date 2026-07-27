import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/idempiere';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';

export async function POST(request: Request) {
  try {
    const { email, name, phone } = await request.json();

    if (!email || !name || !phone) {
      return NextResponse.json({ error: 'Email, name, and phone are required' }, { status: 400 });
    }

    const token = await getAuthToken();

    // 1. Check if user already exists
    const checkRes = await fetch(`${API_URL}/models/AD_User?$filter=EMail eq '${email}'`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (checkRes.ok) {
      const data = await checkRes.json();
      const users = data.records || [];
      if (users.length > 0) {
        return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
      }
    } else {
      console.warn(`⚠️ Failed to check user existence: ${checkRes.status}`);
      // Proceed even if check fails, to avoid blocking signup entirely due to a lookup issue
    }

    // 2. Send OTP
    const otpBody = {
      Email: email,
      Name: name,
      Phone2: phone
    };

    const otpRes = await fetch(`${API_URL}/processes/otpgenerateprocess`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(otpBody)
    });

    if (otpRes.ok) {
      return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } else {
      const errText = await otpRes.text();
      console.error(`❌ OTP Generate Process Error: ${errText}`);
      return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Send OTP route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
