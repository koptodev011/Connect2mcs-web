import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';

interface ReferenceValue {
  id?: string | number;
  identifier?: string;
}

interface UserRecord {
  id: string | number;
  Name?: string;
  EMail?: string;
  IsActive?: boolean;
  VH_IsGuestUser?: boolean;
  AD_Org_ID?: ReferenceValue | string | number;
}

interface ApplicantRecord {
  IsActive?: boolean;
  AD_User_ID?: ReferenceValue | string | number;
  MCS_Jobs_ID?: ReferenceValue | string | number;
}

const referenceId = (value: ReferenceValue | string | number | undefined) =>
  typeof value === 'object' && value !== null ? value.id : value;

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
}

function getTokenIdentity(token: string) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as Record<string, unknown>;
    return {
      id: payload.AD_User_ID ?? payload.userId ?? payload.user_id,
      name: payload.userName ?? payload.username ?? payload.name ?? payload.sub,
    };
  } catch {
    return {};
  }
}

async function idempiereFetch(path: string, token: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: 'no-store',
  });
}

async function loadCurrentUser(token: string) {
  const response = await idempiereFetch('/models/AD_User?$top=100', token);
  if (!response.ok) return null;

  const users = ((await response.json()).records || []) as UserRecord[];
  const identity = getTokenIdentity(token);
  const normalizedName = String(identity.name || '').toLowerCase();
  return users.find(user =>
    user.IsActive !== false &&
    user.VH_IsGuestUser !== true &&
    ((identity.id != null && String(user.id) === String(identity.id)) ||
     (normalizedName && (String(user.id) === String(identity.name) ||
                         user.Name?.toLowerCase() === normalizedName ||
                         user.EMail?.toLowerCase() === normalizedName)))
  ) || null;
}

async function loadApplicants(token: string) {
  const response = await idempiereFetch('/models/MCS_Jobs_Applicants?$top=1000', token);
  if (!response.ok) throw new Error('Could not load job applications');
  return ((await response.json()).records || []) as ApplicantRecord[];
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [user, applicants] = await Promise.all([
      loadCurrentUser(token),
      loadApplicants(token),
    ]);
    if (!user) return NextResponse.json({ error: 'Logged-in user profile was not found' }, { status: 404 });

    const jobIds = applicants
      .filter(record =>
        record.IsActive !== false &&
        String(referenceId(record.AD_User_ID)) === String(user.id)
      )
      .map(record => String(referenceId(record.MCS_Jobs_ID)))
      .filter(id => id && id !== 'undefined');

    return NextResponse.json({ jobIds: [...new Set(jobIds)] });
  } catch (error) {
    console.error('Loading applied jobs failed:', error);
    return NextResponse.json({ error: 'Could not load applied jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId } = await request.json();
    if (!jobId) return NextResponse.json({ error: 'Job is required' }, { status: 400 });

    const [user, applicants, jobResponse] = await Promise.all([
      loadCurrentUser(token),
      loadApplicants(token),
      idempiereFetch(`/models/MCS_Jobs/${encodeURIComponent(String(jobId))}`, token),
    ]);
    if (!user) return NextResponse.json({ error: 'Logged-in user profile was not found' }, { status: 404 });
    if (!jobResponse.ok) return NextResponse.json({ error: 'Job was not found' }, { status: 404 });
    const job = await jobResponse.json();

    const alreadyApplied = applicants.some(record =>
      record.IsActive !== false &&
      String(referenceId(record.AD_User_ID)) === String(user.id) &&
      String(referenceId(record.MCS_Jobs_ID)) === String(job.id)
    );
    if (alreadyApplied) return NextResponse.json({ success: true, alreadyApplied: true });

    const payload = {
      AD_User_ID: {
        id: Number(user.id),
        identifier: String(user.Name || user.EMail || user.id),
      },
      IsActive: true,
      MCS_Jobs_ID: {
        id: Number(job.id),
        identifier: String(job.Name || job.Value || jobId),
      },
    };

    const response = await idempiereFetch('/models/MCS_Jobs_Applicants', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const responseText = await response.text();
    if (!response.ok) {
      console.error('Job application API failed:', response.status, responseText);
      let upstreamError = 'Could not submit job application';
      try {
        const parsed = JSON.parse(responseText);
        upstreamError = String(parsed.message || parsed.error || upstreamError);
      } catch {
        if (responseText.trim()) upstreamError = responseText.trim();
      }
      return NextResponse.json({ error: upstreamError }, { status: response.status });
    }

    let result: unknown = { success: true };
    if (responseText) {
      try { result = JSON.parse(responseText); } catch { result = { success: true }; }
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Job application failed:', error);
    return NextResponse.json({ error: 'Could not submit job application' }, { status: 500 });
  }
}
