export interface ModelReference {
  id?: number | string;
  identifier?: string;
  Name?: string;
  Value?: string;
  email?: string;
  Email?: string;
}

export interface AccommodationRecord {
  id?: number | string;
  AD_User_ID?: ModelReference | string | number;
  C_City_ID?: ModelReference | string | number;
  C_Country_ID?: ModelReference | string | number;
  C_Currency_ID?: ModelReference | string | number;
  City?: string;
  Created?: string;
  CreatedBy?: ModelReference | string | number;
  Description?: string;
  IsActive?: boolean;
  IsApproved?: boolean;
  MCS_Accommodation_Listings_ID?: number | string;
  MCS_Accommodation_Listings_UU?: string;
  MCS_AgencyName?: string;
  MCS_Bathrooms?: number | string;
  MCS_Bedrooms?: number | string;
  MCS_ListingType?: ModelReference | string;
  MCS_siteUrl?: string;
  Name?: string;
  Posted_By_User_ID?: ModelReference | string | number;
  SP_Accommodation_Type?: ModelReference | string;
  SP_Additional_Info?: string;
  SP_Area?: number | string;
  SP_Available_From?: string;
  SP_Available_Until?: string;
  SP_Gender_Preference?: ModelReference | string;
  SP_Has_AC?: boolean;
  SP_Has_Kitchen_Access?: boolean;
  SP_Has_Laundry?: boolean;
  SP_Has_Parking?: boolean;
  SP_Has_WiFi?: boolean;
  SP_Is_Furnished?: boolean;
  SP_Listing_Status?: ModelReference | string;
  SP_Max_Occupants?: number | string;
  SP_Rent_Amount?: number | string;
  SP_Rent_Period?: ModelReference | string;
  Updated?: string;
  UpdatedBy?: ModelReference | string | number;
}

export interface HousingCard {
  id: string;
  title: string;
  city: string;
  country: string;
  rent: string;
  rentAmount: number;
  type: string;
  gender: string;
  size: string;
  host: string;
  ownerId: string;
  ownerEmail: string;
  stay: string;
  image: string;
  images: string[];
  amenities: string[];
  nearMe?: boolean;
  student?: boolean;
  description: string;
  beds: string;
  baths: string;
  area: string;
  availableFrom?: string;
  availableUntil?: string;
  maxOccupants?: number;
  approved?: boolean;
  agencyName?: string;
  created?: string;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85';

function referenceLabel(value: ModelReference | string | number | undefined) {
  if (value && typeof value === 'object') {
    return String(value.identifier || value.Name || value.Value || value.id || '').trim();
  }

  return String(value ?? '').trim();
}

function numberValue(value: number | string | undefined) {
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function pluralizedCount(value: number | string | undefined, singular: string) {
  const count = numberValue(value);
  return `${count || 0} ${singular}${count === 1 ? '' : 's'}`;
}

function isEnabled(value: unknown) {
  return value === true || value === 'true' || value === 'Y' || value === 1;
}

function imageUrls(siteUrl?: string) {
  const urls = String(siteUrl || '')
    .split(/[\n,|]/)
    .map((url) => url.trim())
    .filter((url) => /^https?:\/\//i.test(url));

  return urls.length ? urls : [FALLBACK_IMAGE];
}

function formatRent(record: AccommodationRecord) {
  const amount = numberValue(record.SP_Rent_Amount);
  const currency = referenceLabel(record.C_Currency_ID) || 'INR';
  const period = referenceLabel(record.SP_Rent_Period) || 'mo';
  const formattedAmount = amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const suffix = /month|mo/i.test(period) ? 'mo' : period;

  return `${currency} ${formattedAmount}/${suffix}`;
}

export function accommodationToHousingCard(record: AccommodationRecord): HousingCard {
  const cityReference = referenceLabel(record.C_City_ID);
  const country = referenceLabel(record.C_Country_ID);
  const cityName = record.City?.trim() || cityReference || 'Location available on request';
  const city = country && !cityName.toLowerCase().includes(country.toLowerCase())
    ? `${cityName}, ${country}`
    : cityName;
  const host =
    referenceLabel(record.Posted_By_User_ID) ||
    referenceLabel(record.AD_User_ID) ||
    record.MCS_AgencyName?.trim() ||
    'Community member';
  const type =
    referenceLabel(record.SP_Accommodation_Type) ||
    referenceLabel(record.MCS_ListingType) ||
    'Accommodation';
  const images = imageUrls(record.MCS_siteUrl);
  const amenities = [
    isEnabled(record.SP_Has_WiFi) && 'WiFi',
    isEnabled(record.SP_Has_Kitchen_Access) && 'Kitchen Access',
    isEnabled(record.SP_Has_Laundry) && 'Laundry',
    isEnabled(record.SP_Is_Furnished) && 'Furnished',
    isEnabled(record.SP_Has_Parking) && 'Parking',
    isEnabled(record.SP_Has_AC) && 'A/C',
  ].filter((amenity): amenity is string => Boolean(amenity));
  const status = referenceLabel(record.SP_Listing_Status);
  const id = String(
    record.id ||
      record.MCS_Accommodation_Listings_ID ||
      record.MCS_Accommodation_Listings_UU ||
      '',
  );

  return {
    id,
    title: record.Name?.trim() || `${type} in ${cityName}`,
    city,
    country,
    rent: formatRent(record),
    rentAmount: numberValue(record.SP_Rent_Amount),
    type,
    gender: referenceLabel(record.SP_Gender_Preference) || 'Any',
    size: pluralizedCount(record.MCS_Bedrooms, 'BHK'),
    host,
    ownerId: String(
      typeof record.Posted_By_User_ID === 'object'
        ? record.Posted_By_User_ID?.id || ''
        : record.Posted_By_User_ID ||
            (typeof record.AD_User_ID === 'object'
              ? record.AD_User_ID?.id || ''
              : record.AD_User_ID || ''),
    ),
    ownerEmail:
      typeof record.Posted_By_User_ID === 'object'
        ? String(record.Posted_By_User_ID.email || record.Posted_By_User_ID.Email || '').trim()
        : '',
    stay: status || (record.IsApproved ? 'Verified' : 'Pending verification'),
    image: images[0],
    images,
    amenities,
    description:
      record.Description?.trim() ||
      record.SP_Additional_Info?.trim() ||
      'Contact the property owner for more information about this accommodation.',
    beds: pluralizedCount(record.MCS_Bedrooms, 'Bed'),
    baths: pluralizedCount(record.MCS_Bathrooms, 'Bath'),
    area: record.SP_Area ? `${record.SP_Area} sqft` : 'Area on request',
    availableFrom: record.SP_Available_From,
    availableUntil: record.SP_Available_Until,
    maxOccupants: numberValue(record.SP_Max_Occupants) || undefined,
    approved: record.IsApproved,
    agencyName: record.MCS_AgencyName,
    created: record.Created,
  };
}

export function accommodationRecordsFromPayload(payload: unknown): AccommodationRecord[] {
  if (Array.isArray(payload)) return payload as AccommodationRecord[];
  if (payload && typeof payload === 'object' && 'records' in payload) {
    const records = (payload as { records?: unknown }).records;
    return Array.isArray(records) ? (records as AccommodationRecord[]) : [];
  }
  return [];
}

export const housingCards: HousingCard[] = [];
