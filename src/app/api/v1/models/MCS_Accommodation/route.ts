import { NextRequest, NextResponse } from 'next/server';
import { verifyFavoriteUser } from '@/lib/favorite-session';
import { getAuthToken } from '@/lib/idempiere';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';
const MODEL_NAME = 'MCS_Accommodation';

const ACCOMMODATION_FIELDS = [
  'MCS_Accommodation_Listings_ID',
  'MCS_Accommodation_Listings_UU',
  'AD_User_ID',
  'Posted_By_User_ID',
  'C_City_ID',
  'C_Country_ID',
  'C_Currency_ID',
  'City',
  'Name',
  'Description',
  'IsActive',
  'IsApproved',
  'MCS_AgencyName',
  'MCS_Bathrooms',
  'MCS_Bedrooms',
  'MCS_ListingType',
  'MCS_siteUrl',
  'SP_Accommodation_Type',
  'SP_Additional_Info',
  'SP_Area',
  'SP_Available_From',
  'SP_Available_Until',
  'SP_Gender_Preference',
  'SP_Has_AC',
  'SP_Has_Kitchen_Access',
  'SP_Has_Laundry',
  'SP_Has_Parking',
  'SP_Has_WiFi',
  'SP_Is_Furnished',
  'SP_Listing_Status',
  'SP_Max_Occupants',
  'SP_Rent_Amount',
  'SP_Rent_Period',
  'Created',
  'CreatedBy',
  'Updated',
  'UpdatedBy',
].join(',');

function numericValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function textValue(value: unknown) {
  return String(value ?? '').trim();
}

function booleanValue(value: unknown) {
  return value === true || value === 'true' || value === 'Y';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const top = Math.min(Math.max(Number(searchParams.get('top')) || 100, 1), 100);
    const skip = Math.max(Number(searchParams.get('skip')) || 0, 0);
    const query = new URLSearchParams({
      '$filter': "IsActive eq true and SP_Listing_Status eq 'Active'",
      '$top': String(top),
      '$skip': String(skip),
      '$orderby': 'Created desc',
      '$select': ACCOMMODATION_FIELDS,
    });
    const response = await fetch(`${API_URL}/models/${MODEL_NAME}?${query}`, {
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    const responseText = await response.text();
    const payload = responseText ? JSON.parse(responseText) : { records: [] };

    if (!response.ok) {
      throw new Error(
        `MCS_Accommodation fetch failed (${response.status}): ${responseText}`,
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('MCS_Accommodation fetch failed:', error);
    return NextResponse.json(
      { error: 'Could not load accommodation listings', records: [] },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const signedUserId = verifyFavoriteUser(
      request.cookies.get('mcs_favorite_user')?.value,
    );
    if (!signedUserId) {
      return NextResponse.json(
        { error: 'Please sign in before posting a property.' },
        { status: 401 },
      );
    }

    const input = (await request.json()) as Record<string, unknown>;
    const name = textValue(input.Name);
    const city = textValue(input.City);
    const description = textValue(input.Description);
    const countryId = numericValue(input.C_Country_ID);
    const cityId = numericValue(input.C_City_ID);
    const accommodationType = textValue(input.SP_Accommodation_Type);
    const rentAmount = Number(input.SP_Rent_Amount);
    const bedrooms = Number(input.MCS_Bedrooms);
    const bathrooms = Number(input.MCS_Bathrooms);
    const rentPeriod = textValue(input.SP_Rent_Period) || 'Monthly';
    const listingStatus = textValue(input.SP_Listing_Status) || 'Draft';
    const listingType = textValue(input.MCS_ListingType) || 'P';

    if (!['PG', 'Shared Apartment', 'Single Room'].includes(accommodationType)) {
      return NextResponse.json(
        { error: 'Property type must be PG, Shared Apartment, or Single Room.' },
        { status: 400 },
      );
    }
    if (!name || !city || !countryId || !cityId || !description || !accommodationType) {
      return NextResponse.json(
        { error: 'Title, property type, country, city, and description are required.' },
        { status: 400 },
      );
    }
    if (!['P', 'B'].includes(listingType)) {
      return NextResponse.json(
        { error: 'Listing type must be P (Personal) or B (Business).' },
        { status: 400 },
      );
    }
    if (!['Active', 'Booked', 'Draft', 'Inactive'].includes(listingStatus)) {
      return NextResponse.json(
        { error: 'Listing status must be Active, Booked, Draft, or Inactive.' },
        { status: 400 },
      );
    }
    if (!['Daily', 'Monthly', 'Weekly'].includes(rentPeriod)) {
      return NextResponse.json(
        { error: 'Rent period must be Daily, Monthly, or Weekly.' },
        { status: 400 },
      );
    }
    if (!Number.isFinite(rentAmount) || rentAmount <= 0) {
      return NextResponse.json(
        { error: 'Enter a valid monthly rent.' },
        { status: 400 },
      );
    }

    const payload = {
      AD_User_ID: String(signedUserId),
      Posted_By_User_ID: String(signedUserId),
      C_City_ID: cityId,
      C_Country_ID: countryId,
      C_Currency_ID: numericValue(input.C_Currency_ID),
      City: city,
      Name: name,
      Description: description,
      IsActive: true,
      IsApproved: false,
      MCS_AgencyName: textValue(input.MCS_AgencyName) || undefined,
      MCS_Bathrooms: Number.isFinite(bathrooms) ? bathrooms : 0,
      MCS_Bedrooms: Number.isFinite(bedrooms) ? bedrooms : 0,
      MCS_ListingType: listingType,
      MCS_siteUrl: textValue(input.MCS_siteUrl) || undefined,
      SP_Accommodation_Type: accommodationType,
      SP_Additional_Info: textValue(input.SP_Additional_Info) || undefined,
      SP_Area: Number(input.SP_Area) || undefined,
      SP_Available_From: textValue(input.SP_Available_From) || undefined,
      SP_Available_Until: textValue(input.SP_Available_Until) || undefined,
      SP_Gender_Preference:
        textValue(input.SP_Gender_Preference) || 'Any',
      SP_Has_AC: booleanValue(input.SP_Has_AC),
      SP_Has_Kitchen_Access: booleanValue(input.SP_Has_Kitchen_Access),
      SP_Has_Laundry: booleanValue(input.SP_Has_Laundry),
      SP_Has_Parking: booleanValue(input.SP_Has_Parking),
      SP_Has_WiFi: booleanValue(input.SP_Has_WiFi),
      SP_Is_Furnished: booleanValue(input.SP_Is_Furnished),
      SP_Listing_Status: listingStatus,
      SP_Max_Occupants: Number(input.SP_Max_Occupants) || undefined,
      SP_Rent_Amount: rentAmount,
      SP_Rent_Period: rentPeriod,
    };
    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    );
    const response = await fetch(`${API_URL}/models/${MODEL_NAME}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedPayload),
      cache: 'no-store',
    });
    const responseText = await response.text();
    let responsePayload: Record<string, unknown> = {};
    try {
      responsePayload = responseText ? JSON.parse(responseText) : {};
    } catch {}

    if (!response.ok) {
      const detail = String(
        responsePayload.message ||
          responsePayload.error ||
          responseText ||
          `iDempiere returned ${response.status}`,
      );
      return NextResponse.json({ error: detail }, { status: response.status });
    }

    return NextResponse.json(responsePayload, { status: response.status });
  } catch (error) {
    console.error('MCS_Accommodation create failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not create accommodation listing',
      },
      { status: 500 },
    );
  }
}







