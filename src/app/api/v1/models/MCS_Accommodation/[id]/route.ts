import { NextRequest, NextResponse } from 'next/server';
import { verifyFavoriteUser } from '@/lib/favorite-session';
import { fetchModelRecord, getAuthToken } from '@/lib/idempiere';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';
const MODEL_NAME = 'MCS_Accommodation';
type Reference = { id?: number | string };
type AccommodationRecord = {
  AD_User_ID?: Reference | number | string;
  Posted_By_User_ID?: Reference | number | string;
};

function referenceId(value: Reference | number | string | undefined) {
  return String(value && typeof value === 'object' ? value.id || '' : value || '');
}

function referenceValue(value: unknown) {
  if (value && typeof value === 'object' && 'id' in value) {
    return String((value as { id?: unknown }).id || '').trim();
  }
  return String(value ?? '').trim();
}
function currentUserId(request: NextRequest) {
  return verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value);
}

function owns(record: AccommodationRecord, userId: number) {
  return [record.Posted_By_User_ID, record.AD_User_ID]
    .map(referenceId)
    .includes(String(userId));
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    return NextResponse.json(await fetchModelRecord(MODEL_NAME, id));
  } catch (error) {
    console.error('Accommodation record fetch failed:', error);
    return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = currentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to edit this property.' }, { status: 401 });
    }
    const { id } = await context.params;
    const existing = (await fetchModelRecord(MODEL_NAME, id)) as AccommodationRecord;
    if (!owns(existing, userId)) {
      return NextResponse.json({ error: 'You can edit only properties you created.' }, { status: 403 });
    }

    const input = (await request.json()) as Record<string, unknown>;
    const allowed = [
      'Name', 'Description', 'City', 'C_City_ID', 'C_Country_ID',
      'C_Currency_ID', 'MCS_AgencyName', 'MCS_Bathrooms', 'MCS_Bedrooms',
      'MCS_ListingType', 'MCS_siteUrl', 'SP_Accommodation_Type',
      'SP_Additional_Info', 'SP_Area', 'SP_Available_From',
      'SP_Available_Until', 'SP_Gender_Preference', 'SP_Has_AC',
      'SP_Has_Kitchen_Access', 'SP_Has_Laundry', 'SP_Has_Parking',
      'SP_Has_WiFi', 'SP_Is_Furnished', 'SP_Max_Occupants',
      'SP_Rent_Amount', 'SP_Rent_Period',
    ];
    const payload = Object.fromEntries(
      allowed.filter((key) => key in input).map((key) => [key, input[key]]),
    );
    if (!String(payload.Name || '').trim() || Number(payload.SP_Rent_Amount) <= 0) {
      return NextResponse.json({ error: 'Title and a valid rent amount are required.' }, { status: 400 });
    }
    const listingType = referenceValue(payload.MCS_ListingType || 'P');
    const rentPeriod = referenceValue(payload.SP_Rent_Period);
    const propertyType = referenceValue(payload.SP_Accommodation_Type);
    const genderPreference = referenceValue(payload.SP_Gender_Preference);
    if (!['P', 'B'].includes(listingType)) {
      return NextResponse.json({ error: 'Invalid listing type.' }, { status: 400 });
    }
    if (!['Daily', 'Monthly', 'Weekly'].includes(rentPeriod)) {
      return NextResponse.json({ error: 'Invalid rent period.' }, { status: 400 });
    }
    if (!['PG', 'Shared Apartment', 'Single Room'].includes(propertyType)) {
      return NextResponse.json({ error: 'Invalid property type.' }, { status: 400 });
    }
    payload.MCS_ListingType = listingType;
    payload.SP_Rent_Period = rentPeriod;
    payload.SP_Accommodation_Type = propertyType;
    if (genderPreference) payload.SP_Gender_Preference = genderPreference;

    const response = await fetch(`${API_URL}/models/${MODEL_NAME}/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const text = await response.text();
    let result: Record<string, unknown> = {};
    try { result = text ? JSON.parse(text) : {}; } catch {}
    if (!response.ok) {
      return NextResponse.json(
        { error: String(result.message || result.error || text || 'Could not update property') },
        { status: response.status },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Accommodation update failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update property' },
      { status: 500 },
    );
  }
}


export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = currentUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Please sign in to delete this property.' },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const existing = (await fetchModelRecord(
      MODEL_NAME,
      id,
    )) as AccommodationRecord;
    if (!owns(existing, userId)) {
      return NextResponse.json(
        { error: 'You can delete only properties you created.' },
        { status: 403 },
      );
    }

    const response = await fetch(`${API_URL}/models/${MODEL_NAME}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    const text = await response.text();
    let result: Record<string, unknown> = {};
    try {
      result = text ? JSON.parse(text) : {};
    } catch {}

    if (!response.ok) {
      return NextResponse.json(
        {
          error: String(
            result.message || result.error || text || 'Could not delete property',
          ),
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Accommodation delete failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not delete property',
      },
      { status: 500 },
    );
  }
}
