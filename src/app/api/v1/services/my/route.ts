import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/idempiere';
import { verifyFavoriteUser } from '@/lib/favorite-session';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';

const MODELS = ['MCS_TiffinProvider', 'MCS_Maid', 'MCS_TaxiDriver', 'MCS_Mentor'] as const;
const KINDS = ['tiffin', 'maid', 'taxi', 'mentor'] as const;

type Reference = { id?: string | number; identifier?: string; Name?: string };
type RawRecord = Record<string, unknown> & { id?: string | number; Updated?: string };

function refName(value: unknown): string {
  if (value && typeof value === 'object') {
    return String((value as Reference).identifier ?? (value as Reference).Name ?? '');
  }
  return String(value ?? '');
}

function normalize(kind: (typeof KINDS)[number], record: RawRecord) {
  const id = Number(record.id);
  const city = refName(record.C_City_ID);
  const currency = refName(record.C_Currency_ID);
  const services = String(record.MCS_Services || '');
  let title = '';
  let subtitle = '';
  let meta: string[] = [];

  switch (kind) {
    case 'tiffin': {
      const menu = String(record.MCS_Menu || '')
        .split(',')
        .map((dish) => dish.trim())
        .filter(Boolean);
      title =
        String(record.Name || '').trim() ||
        refName(record.AD_User_ID) ||
        (menu[0] ? menu[0] + ' Home Kitchen' : 'Home Tiffin #' + id);
      subtitle =
        String(record.MCS_Specialty || '').trim() ||
        refName(record.MCS_Tiffin_Category_ID) ||
        'Home Food';
      meta = [
        record.MCS_PricePerMeal ? currency + record.MCS_PricePerMeal + '/meal' : '',
        city,
        record.MCS_ServiceDays ? record.MCS_ServiceDays + ' days/week' : '',
      ].filter(Boolean);
      break;
    }
    case 'maid': {
      title = String(record.Name || '').trim() || 'Maid #' + id;
      subtitle = services || refName(record.MCS_Maid_Category) || 'Domestic help';
      meta = [
        record.MCS_Rate ? currency + record.MCS_Rate : '',
        city,
        refName(record.MCS_Languages).replace(/[<>]/g, '').split(',').map((item) => item.trim()).filter(Boolean).join(', '),
      ].filter(Boolean);
      break;
    }
    case 'taxi': {
      title = String(record.MCS_Vehicle || '').trim() || 'Taxi Driver #' + id;
      subtitle = String(record.MCS_VehicleType || '').trim() || 'Taxi service';
      meta = [
        record.MCS_BaseFare ? 'Base ' + record.MCS_BaseFare : '',
        city,
        String(record.Phone || '').trim(),
      ].filter(Boolean);
      break;
    }
    case 'mentor': {
      title = String(record.Name || '').trim() || 'Mentor #' + id;
      subtitle = [record.MCS_Designation, record.MCS_CompanyName]
        .filter(Boolean)
        .join(' · ');
      meta = [
        record.MCS_SessionRate ? currency + record.MCS_SessionRate + '/session' : '',
        String(record.MCS_Industry || '').trim(),
      ].filter(Boolean);
      break;
    }
  }

  return {
    kind,
    id,
    title: title || 'Service #' + id,
    subtitle,
    meta,
    updatedAt: String(record.Updated || ''),
    record,
  };
}

export async function GET(request: NextRequest) {
  const userId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value);
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  try {
    const token = await getAuthToken();
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

    const results = await Promise.all(
      MODELS.map(async (model, index) => {
        try {
          const url = `${API_URL}/models/${model}?$filter=${encodeURIComponent(
            `AD_User_ID eq ${userId} and IsActive eq true`,
          )}&$top=10`;
          const response = await fetch(url, { headers, cache: 'no-store' });
          if (!response.ok) return [];
          const payload = (await response.json()) as { records?: RawRecord[] };
          return (payload.records || []).map((record) =>
            normalize(KINDS[index], record),
          );
        } catch (error) {
          console.error(`Failed to load ${model} for user ${userId}:`, error);
          return [];
        }
      }),
    );

    return NextResponse.json({ services: results.flat() });
  } catch (error) {
    console.error('Load my services failed:', error);
    return NextResponse.json(
      { error: 'Could not load your services', services: [] },
      { status: 500 },
    );
  }
}