import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/idempiere';
import { idempiereSecureRequest } from '@/lib/idempiere-secure';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';
const API_SECURE_URL = process.env.IDEMPIERE_API_SECURE_URL
  || API_URL.replace('http://', 'https://').replace(':8080', ':8443');
const CLIENT_ID = Number(process.env.IDEMPIERE_CLIENT_ID) || 1000011;
const ORG_ID = Number(process.env.IDEMPIERE_ORG_ID) || 0;
const APP_USER_ROLE_ID = 1000031;

type IdempiereResponse = {
  id?: number;
  summary?: string;
  detail?: string;
  message?: string;
  isError?: boolean | string;
};

async function readResponse(response: Response): Promise<IdempiereResponse> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as IdempiereResponse;
  } catch {
    return { message: text };
  }
}

function responseMessage(data: IdempiereResponse, fallback: string) {
  return data.detail || data.message || data.summary || fallback;
}

function extractUserId(data: IdempiereResponse) {
  if (typeof data.id === 'number') return data.id;
  const match = data.summary?.match(/AD_User_ID:\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      firstName, email, phone, otp, password, userType, residencyType,
      countryId, cityId, entType, businessName, businessDesc, businessEmail, businessPhone, businessWebsite,
    } = body;

    if (!email || !firstName || !phone || !otp || !password || !userType || !residencyType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const token = await getAuthToken();
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const otpRes = await fetch(`${API_URL}/processes/otpvalidationprocess`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ EMail: normalizedEmail, OTP: String(otp).trim(), ResetPassword: 'N' }),
      cache: 'no-store',
    });
    const otpData = await readResponse(otpRes);
    const otpFailed = !otpRes.ok || otpData.isError === true || String(otpData.isError).toLowerCase() === 'true';

    if (otpFailed) {
      const message = responseMessage(otpData, 'Invalid or expired OTP');
      const alreadyExists = /failed to create user|already exist|already registered|user already/i.test(message);
      return NextResponse.json(
        { error: alreadyExists ? 'User already exists' : message },
        { status: alreadyExists ? 409 : 400 },
      );
    }

    const userId = extractUserId(otpData);
    if (!userId) {
      console.error('OTP validation did not return AD_User_ID:', otpData);
      return NextResponse.json(
        { error: 'OTP verified but the user account reference was not returned' },
        { status: 502 },
      );
    }

    let description: string | undefined;
    if (userType === 'Entrepreneur' && entType) {
      if (String(entType).toLowerCase() === 'other') {
        description = [
          'Entrepreneur Type: Other',
          businessName && `Business Name: ${String(businessName).trim()}`,
          businessDesc && `Business Description: ${String(businessDesc).trim()}`,
          businessEmail && `Business Email: ${String(businessEmail).trim()}`,
          businessPhone && `Business Phone: ${String(businessPhone).trim()}`,
          businessWebsite && `Website/Link: ${String(businessWebsite).trim()}`,
        ].filter(Boolean).join('\n');
      } else {
        description = `Entrepreneur Type: ${String(entType)
          .split(' ')
          .filter(Boolean)
          .map((word) => word[0].toUpperCase() + word.slice(1))
          .join(' ')}`;
      }
    }

    const passwordRes = await idempiereSecureRequest<IdempiereResponse>(
      `${API_SECURE_URL}/models/AD_User/${userId}`,
      'PUT',
      token,
      {
        Password: password,
        Phone2: String(phone).trim(),
        ...(Number(countryId) > 0 ? { C_Country_ID: Number(countryId) } : {}),
        ...(Number(cityId) > 0 ? { C_City_ID: Number(cityId) } : {}),
        ...(description ? { Description: description } : {}),
      },
    );

    if (!passwordRes.ok) {
      console.error('Password/profile update failed:', passwordRes.data);
      return NextResponse.json(
        { error: responseMessage(passwordRes.data, 'Account created but failed to set password') },
        { status: 502 },
      );
    }

    const userIdentifier = normalizedEmail.split('@')[0];
    const roleRes = await idempiereSecureRequest<IdempiereResponse>(
      `${API_SECURE_URL}/models/AD_User_Roles`,
      'POST',
      token,
      {
        AD_User_ID: { id: userId, identifier: userIdentifier, 'model-name': 'ad_user' },
        AD_Role_ID: { id: APP_USER_ROLE_ID, identifier: 'App User', 'model-name': 'ad_role' },
        AD_Client_ID: { id: CLIENT_ID, identifier: 'MCS Connect', 'model-name': 'ad_client' },
        AD_Org_ID: { id: ORG_ID, identifier: '*', 'model-name': 'ad_org' },
        IsActive: true,
        'model-name': 'ad_user_roles',
      },
    );

    if (!roleRes.ok) {
      console.error('Role assignment failed:', roleRes.data);
    }

    return NextResponse.json({ success: true, message: 'Registration complete', userId });
  } catch (error) {
    console.error('Complete registration route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
