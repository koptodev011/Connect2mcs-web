import { NextResponse } from 'next/server';
import { signFavoriteUser } from '@/lib/favorite-session';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // 1. Attempt authentication with the iDempiere ERP server
    try {
      const parameters: Record<string, string | number> = {
        clientId: Number(process.env.IDEMPIERE_CLIENT_ID),
        organizationId: Number(process.env.IDEMPIERE_ORG_ID),
        warehouseId: Number(process.env.IDEMPIERE_WAREHOUSE_ID),
        language: process.env.IDEMPIERE_LANGUAGE || 'en_US',
      };

      if (process.env.IDEMPIERE_ROLE_ID) {
        const roleId = Number(process.env.IDEMPIERE_ROLE_ID);
        if (!isNaN(roleId)) {
          parameters.roleId = roleId;
        }
      }

      const authData = {
        userName: username,
        password: password,
        parameters,
      };

      console.log(`🔐 Attempting iDempiere auth for user: ${username}`);
      
      const response = await fetch(`${API_URL}/auth/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ iDempiere authentication successful for: ${username}`);
        
        const initials = username
          .split(/\s+/)
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'U';

        const escapedUsername = String(username).replace(/'/g, "''");
        const filters = [`Name eq '${escapedUsername}'`, `Value eq '${escapedUsername}'`, `EMail eq '${escapedUsername}'`];
        let erpUser: { id?: number | string } | null = null;
        for (const filter of filters) {
          const userResponse = await fetch(`${API_URL}/models/AD_User?$filter=${encodeURIComponent(filter)}&$top=1`, { headers: { Authorization: `Bearer ${data.token}`, Accept: 'application/json' }, cache: 'no-store' });
          if (userResponse.ok) { const payload = await userResponse.json() as { records?: Array<{ id?: number | string }> }; erpUser = payload.records?.[0] || null; if (erpUser) break; }
        }
        const userId = Number(erpUser?.id) || null;
        const loginResponse = NextResponse.json({ success: true, token: data.token, user: { id: userId, name: username, city: 'Mumbai', avatar: initials } });
        if (userId) loginResponse.cookies.set('mcs_favorite_user', signFavoriteUser(userId), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 });
        return loginResponse;
      } else {
        const errMsg = await response.text();
        console.warn(`⚠️ iDempiere auth rejected: ${response.status} ${errMsg}`);
      }
    } catch (idempiereErr) {
      console.error('❌ iDempiere login connection error:', idempiereErr);
    }

    // 2. Fallback mock authentication for development/testing
    if (username === 'admin' && password === 'admin123') {
      console.log('🤖 Mock authentication successful for admin');
      return NextResponse.json({
        success: true,
        token: 'mock-jwt-token-for-admin',
        user: {
          name: 'Administrator',
          city: 'London',
          avatar: 'AD'
        }
      });
    }

    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  } catch (error) {
    console.error('❌ Login API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
