import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/idempiere';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';
const API_SECURE_URL = API_URL.replace('http://', 'https://').replace(':8080', ':8443');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      firstName, email, phone, otp, password, 
      userType, residencyType,
      entType, businessName, businessDesc, businessEmail, businessPhone, businessWebsite 
    } = body;

    if (!email || !firstName || !phone || !otp || !password || !userType || !residencyType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const token = await getAuthToken();
    const clientId = Number(process.env.IDEMPIERE_CLIENT_ID) || 11;
    const orgId = Number(process.env.IDEMPIERE_ORG_ID) || 11;

    // Build Description Field
    let description = `User Type: ${userType}, Residency: ${residencyType}`;
    if (userType === 'E' && entType) {
      description += `, Ent Type: ${entType}`;
      if (entType === 'Other') {
        description += `\nBusiness: ${businessName || ''}\nDesc: ${businessDesc || ''}\nEmail: ${businessEmail || ''}\nPhone: ${businessPhone || ''}\nWebsite: ${businessWebsite || ''}`;
      }
    }

    // 1. Create User
    const createUserBody = {
      Name: firstName,
      Description: description,
      Phone2: phone,
      EMail: email,
      Value: email,
      IsActive: true,
      IsFullBPAccess: true,
      AD_Client_ID: clientId,
      AD_Org_ID: orgId
    };

    let userId = null;
    const userRes = await fetch(`${API_URL}/models/AD_User`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(createUserBody)
    });

    if (userRes.ok) {
      const userData = await userRes.json();
      userId = userData.id;
    } else {
      const err = await userRes.text();
      console.error(`❌ User Creation Error:`, err);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // 2. Verify OTP
    const otpRes = await fetch(`${API_URL}/processes/otpvalidationprocess`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ Email: email, OTP: otp, Phone2: phone })
    });

    if (!otpRes.ok) {
      // If OTP fails, we technically have a created user but unverified.
      const err = await otpRes.text();
      console.error(`❌ OTP Validation Error:`, err);
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // 3. Update Password
    const pwRes = await fetch(`${API_SECURE_URL}/models/AD_User/${userId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ Password: password })
    });

    if (!pwRes.ok) {
      console.error(`❌ Password Update Error:`, await pwRes.text());
      return NextResponse.json({ error: 'Account created but failed to set password. Please try resetting it.' }, { status: 500 });
    }

    // 4. Assign Role
    const roleRes = await fetch(`${API_SECURE_URL}/models/AD_User_Roles`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        AD_User_ID: userId,
        AD_Role_ID: 1000031,
        AD_Client_ID: clientId,
        AD_Org_ID: orgId,
        Value: email
      })
    });

    if (!roleRes.ok) {
      console.error(`❌ Role Assignment Error:`, await roleRes.text());
      // Non-fatal error, user can still login technically
    }

    return NextResponse.json({ success: true, message: 'Registration complete' });

  } catch (error) {
    console.error('❌ Complete Registration route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
