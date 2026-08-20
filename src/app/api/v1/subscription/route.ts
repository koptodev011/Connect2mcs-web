import { NextRequest, NextResponse } from 'next/server';
import { idempiereSecureRequest } from '@/lib/idempiere-secure';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';
const API_SECURE_URL = process.env.IDEMPIERE_API_SECURE_URL
  || API_URL.replace('http://', 'https://').replace(':8080', ':8443');

const PLAN_LEVELS: Record<string, number> = { S: 0, J: 1, E: 2 };
const PLAN_LABELS: Record<string, string> = { S: 'Student', J: 'NRI', E: 'Entrepreneur' };

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

function extractPlan(record: Record<string, unknown>): string {
  const value = record.MCS_LoginType;
  if (value && typeof value === 'object') {
    const ref = value as { identifier?: string; id?: string | number };
    return String(ref.identifier ?? ref.id ?? '').toUpperCase();
  }
  return String(value ?? '').toUpperCase();
}

export async function PUT(request: NextRequest) {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = tokenUserId(token);
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { plan?: string };
  try {
    body = await request.json() as { plan?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const plan = String(body.plan || '').toUpperCase();
  if (!(plan in PLAN_LEVELS)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  try {
    const userResponse = await fetch(`${API_URL}/models/AD_User/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Could not load current plan' }, { status: userResponse.status });
    }

    const user = await userResponse.json() as Record<string, unknown>;
    const currentPlan = extractPlan(user);
    const currentLevel = PLAN_LEVELS[currentPlan] ?? PLAN_LEVELS.S;
    const targetLevel = PLAN_LEVELS[plan];

    if (targetLevel <= currentLevel) {
      return NextResponse.json(
        {
          error: `You are already on the ${PLAN_LABELS[currentPlan] || currentPlan} plan or higher`,
        },
        { status: 400 },
      );
    }

    const updateResponse = await idempiereSecureRequest<{ id?: number; message?: string }>(
      `${API_SECURE_URL}/models/AD_User/${encodeURIComponent(userId)}`,
      'PUT',
      token,
      { MCS_LoginType: plan },
    );

    if (!updateResponse.ok) {
      console.error('Subscription upgrade failed:', updateResponse.data);
      return NextResponse.json(
        { error: updateResponse.data?.message || 'Could not upgrade plan' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      plan,
      label: PLAN_LABELS[plan],
      message: `Upgraded to the ${PLAN_LABELS[plan]} plan`,
    });
  } catch (error) {
    console.error('Subscription upgrade route error:', error);
    return NextResponse.json({ error: 'Could not upgrade plan' }, { status: 500 });
  }
}