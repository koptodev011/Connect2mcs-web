import { NextRequest, NextResponse } from 'next/server';
import { verifyFavoriteUser } from '@/lib/favorite-session';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';
type Reference = { id?: string | number; identifier?: string };
type UserRecord = { id: string | number; Name?: string; EMail?: string; IsActive?: boolean; VH_IsGuestUser?: boolean };
type RequestRecord = { id?: string | number; Name?: string; Created?: string; IsActive?: boolean; AD_User_ID?: Reference | string | number; MCS_Mentor_ID?: Reference | string | number; MCS_Status?: Reference | string };
const bearerToken = (request: NextRequest) => { const value = request.headers.get('authorization') || ''; return value.startsWith('Bearer ') ? value.slice(7).trim() : ''; };
const apiFetch = (path: string, token: string, init?: RequestInit) => fetch(`${API_URL}${path}`, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers }, cache: 'no-store' });

async function currentUser(request: NextRequest, token: string, requestedUserId: number) {
  const verifiedUserId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value);
  if (verifiedUserId !== requestedUserId) return null;
  const response = await apiFetch(`/models/AD_User/${encodeURIComponent(String(verifiedUserId))}`, token);
  if (!response.ok) return null;
  const user = await response.json() as UserRecord;
  if (String(user.id) !== String(verifiedUserId) || user.IsActive === false || user.VH_IsGuestUser === true) return null;
  return user;
}

async function matchingRequests(token: string, userId: number, mentorId?: number) {
  const condition = mentorId ? `AD_User_ID eq ${userId} and MCS_Mentor_ID eq ${mentorId}` : `AD_User_ID eq ${userId}`;
  const filter = encodeURIComponent(condition);
  const response = await apiFetch(`/models/MCS_Mentorship_Request?$filter=${filter}&$top=100`, token);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`MCS_Mentorship_Request lookup failed (${response.status}): ${detail}`);
  }
  return ((await response.json()).records || []) as RequestRecord[];
}

const isAccepted = (record: RequestRecord) => {
  const status = record.MCS_Status;
  const id = typeof status === 'object' && status !== null ? status.id : status;
  const label = typeof status === 'object' && status !== null ? status.identifier : status;
  return String(id || '').toUpperCase() === 'A' || String(label || '').toLowerCase() === 'accepted';
};


async function currentMentorId(request: NextRequest, token: string) {
  const userId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value);
  if (!userId) return 0;
  const filter = encodeURIComponent(`AD_User_ID eq ${userId} and IsActive eq true`);
  const response = await apiFetch(`/models/MCS_Mentor?$filter=${filter}&$top=1`, token);
  if (!response.ok) return 0;
  const data = await response.json() as { records?: Array<{ id?: number }> };
  return Number(data.records?.[0]?.id);
}

const statusValue = (record: RequestRecord) => {
  const status = record.MCS_Status;
  return String(typeof status === 'object' && status !== null ? status.id || status.identifier || '' : status || '').toUpperCase();
};
export async function GET(request: NextRequest) {
  try {
    const token = bearerToken(request);
    const userId = Number(request.nextUrl.searchParams.get('userId'));
    const mentorId = Number(request.nextUrl.searchParams.get('mentorId')) || undefined;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (request.nextUrl.searchParams.get('received') === 'true') {
      const mentorId = await currentMentorId(request, token);
      if (!mentorId) return NextResponse.json({ error: 'An active mentor profile is required' }, { status: 403 });
      const filter = encodeURIComponent(`MCS_Mentor_ID eq ${mentorId} and IsActive eq true`);
      const response = await apiFetch(`/models/MCS_Mentorship_Request?$filter=${filter}&$top=100&$orderby=Created desc`, token);
      if (!response.ok) return NextResponse.json({ error: await response.text() }, { status: response.status });
      const records = ((await response.json()).records || []) as RequestRecord[];
      return NextResponse.json(records.filter(record => { const status = statusValue(record); return !status || status === 'P'; }).map(record => ({
        id: String(record.id || ''),
        name: record.Name || (typeof record.AD_User_ID === 'object' ? record.AD_User_ID.identifier : '') || 'Community member',
        userId: String(typeof record.AD_User_ID === 'object' ? record.AD_User_ID.id || '' : record.AD_User_ID || ''),
        status: statusValue(record) || 'P',
        created: record.Created || '',
      })));
    }
    if (!userId) return NextResponse.json({ error: 'Logged-in user ID is required' }, { status: 400 });
    const user = await currentUser(request, token, userId);
    if (!user) return NextResponse.json({ error: 'Logged-in user session is invalid. Please log in again' }, { status: 403 });
    const matching = (await matchingRequests(token, Number(user.id), mentorId)).filter(record => record.IsActive !== false);
    const acceptedRequests = matching.filter(isAccepted);
    const mentorIds = [...new Set(acceptedRequests.map(record => String(typeof record.MCS_Mentor_ID === 'object' && record.MCS_Mentor_ID !== null ? record.MCS_Mentor_ID.id : record.MCS_Mentor_ID)).filter(Boolean))];
    const requestedMentorIds = [...new Set(matching.map(record => String(typeof record.MCS_Mentor_ID === 'object' && record.MCS_Mentor_ID !== null ? record.MCS_Mentor_ID.id : record.MCS_Mentor_ID)).filter(Boolean))];
    return NextResponse.json({ userId: Number(user.id), accepted: mentorId ? acceptedRequests.length > 0 : false, requested: mentorId ? matching.length > 0 : false, mentorIds, requestedMentorIds });
  } catch (error) {
    console.error('Loading mentorship request failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load mentorship request' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = bearerToken(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const input = await request.json();
    const userId = Number(input.AD_User_ID ?? input.userId);
    const mentorId = Number(input.MCS_Mentor_ID ?? input.mentorId);
    if (!userId) return NextResponse.json({ error: 'Logged-in user ID is required' }, { status: 400 });
    if (!mentorId) return NextResponse.json({ error: 'Mentor is required' }, { status: 400 });
    const user = await currentUser(request, token, userId);
    if (!user) return NextResponse.json({ error: 'Logged-in user session is invalid. Please log in again' }, { status: 403 });
    const existing = (await matchingRequests(token, Number(user.id), mentorId)).find(record => record.IsActive !== false);
    if (existing) return NextResponse.json({ success: true, userId: Number(user.id), requested: true, accepted: isAccepted(existing) });
    const payload = { Name: String(user.Name || user.EMail || user.id), AD_User_ID: Number(user.id), MCS_Mentor_ID: mentorId };
    const response = await apiFetch('/models/MCS_Mentorship_Request', token, { method: 'POST', body: JSON.stringify(payload) });
    const text = await response.text();
    if (!response.ok) return NextResponse.json({ error: `MCS_Mentorship_Request create failed (${response.status}): ${text}` }, { status: response.status });
    let result: unknown = { success: true, userId: Number(user.id), requested: true };
    if (text) try { result = JSON.parse(text); } catch { /* use success response */ }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Sending mentorship request failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not send mentorship request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = bearerToken(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const input = await request.json();
    const requestId = Number(input.requestId);
    const status = String(input.status || '').toUpperCase();
    if (!requestId || !['A', 'R'].includes(status)) return NextResponse.json({ error: 'A valid request and action are required' }, { status: 400 });
    const mentorId = await currentMentorId(request, token);
    if (!mentorId) return NextResponse.json({ error: 'An active mentor profile is required' }, { status: 403 });
    const recordResponse = await apiFetch(`/models/MCS_Mentorship_Request/${requestId}`, token);
    if (!recordResponse.ok) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    const record = await recordResponse.json() as RequestRecord;
    const recordMentorId = Number(typeof record.MCS_Mentor_ID === 'object' ? record.MCS_Mentor_ID.id : record.MCS_Mentor_ID);
    if (recordMentorId !== mentorId) return NextResponse.json({ error: 'You can only manage requests sent to you' }, { status: 403 });
    const response = await apiFetch(`/models/MCS_Mentorship_Request/${requestId}`, token, { method: 'PUT', body: JSON.stringify({ MCS_Status: status }) });
    const text = await response.text();
    if (!response.ok) return NextResponse.json({ error: text || 'Could not update request' }, { status: response.status });
    return NextResponse.json({ success: true, requestId, status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update mentorship request' }, { status: 500 });
  }
}