import { NextRequest, NextResponse } from 'next/server'
import { verifyFavoriteUser } from '@/lib/favorite-session'
import { getAuthToken } from '@/lib/idempiere'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'

type Reference = { id?: number | string; identifier?: string; Name?: string }
type TaxiRecord = {
  id?: number | string
  C_Country_ID?: Reference | string
  Country?: Reference | string
  MCS_Country?: string
  ContactDescription?: string
  Rating?: number
  reviewCount?: number
}
type TaxiServiceRequest = {
  id?: number | string
  IsActive?: boolean
  MCS_Rating?: number | string
  MCS_DriverRating?: number | string
  Rating?: number | string
  MCS_Review?: string
  Review?: string
}
type TaxiServiceQuote = {
  IsActive?: boolean
  MCS_Taxi_Service_Request_ID?: Reference | string | number
  MCS_TaxiDriver_ID?: Reference | string | number
  MCS_Status?: Reference | string
}

function referenceId(value: Reference | string | number | undefined) {
  return String(typeof value === 'object' && value !== null ? value.id || '' : value || '')
}

function isAcceptedStatus(value: Reference | string | undefined) {
  const code = typeof value === 'object' && value !== null
    ? value.id || value.identifier || ''
    : value || ''
  return ['a', 'accepted'].includes(String(code).trim().toLowerCase())
}

function normalizeCountry(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[.]/g, '')
  const aliases: Record<string, string> = {
    usa: 'united states',
    'united states of america': 'united states',
    us: 'united states',
    uk: 'united kingdom',
    uae: 'united arab emirates',
  }
  return aliases[normalized] || normalized
}

function getTaxiCountry(record: TaxiRecord) {
  const reference = record.C_Country_ID ?? record.Country
  if (typeof reference === 'string' && reference.trim()) return reference
  const explicitCountry = typeof reference === 'object' && reference !== null
    ? reference.identifier || reference.Name
    : record.MCS_Country
  if (explicitCountry?.trim()) return explicitCountry

  const location = (record.ContactDescription || '').toLowerCase()
  if (/boston|edison|new jersey|newark|cambridge/.test(location)) return 'United States'
  if (/toronto|mississauga/.test(location)) return 'Canada'
  if (/london|heathrow|gatwick|luton/.test(location)) return 'United Kingdom'
  if (/sydney|parramatta/.test(location)) return 'Australia'
  if (/mumbai|pune|india/.test(location)) return 'India'
  return ''
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSize = Math.min(Math.max(Number(searchParams.get('top')) || 50, 1), 100)
    const skipRecords = Math.max(Number(searchParams.get('skip')) || 0, 0)
    const countryCookie = (request.headers.get('cookie') || '')
      .split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith('mcs_country='))
    const selectedCountry = countryCookie
      ? decodeURIComponent(countryCookie.substring('mcs_country='.length))
      : 'All'

    const query = new URLSearchParams({
      '$filter': 'IsActive eq true',
      '$top': '100',
      '$orderby': 'Created desc',
      '$select': 'MCS_TaxiDriver_ID,AD_User_ID,IsActive,MCS_Vehicle,MCS_VehicleType,Rate,MCS_BaseFare,Rating,Counter,IsAvailable,ContactDescription,MCS_IsVerified,C_Country_ID,C_City_ID,Phone,AD_Language,MCS_ComplementoryFood,Created',
    })
    const token = await getAuthToken()
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    const [taxiResponse, requestsResponse, quotesResponse] = await Promise.all([
      fetch(`${API_URL}/models/MCS_TaxiDriver?${query.toString()}`, { headers, cache: 'no-store' }),
      fetch(`${API_URL}/models/MCS_Taxi_Service_Request?$filter=${encodeURIComponent('IsActive eq true')}&$top=100`, { headers, cache: 'no-store' }),
      fetch(`${API_URL}/models/MCS_Taxi_Service_Quote?$filter=${encodeURIComponent('IsActive eq true')}&$top=100`, { headers, cache: 'no-store' }),
    ])
    const [taxiText, requestsText, quotesText] = await Promise.all([
      taxiResponse.text(), requestsResponse.text(), quotesResponse.text(),
    ])
    if (!taxiResponse.ok) throw new Error(`MCS_TaxiDriver fetch failed (${taxiResponse.status}): ${taxiText}`)
    if (!requestsResponse.ok) throw new Error(`MCS_Taxi_Service_Request fetch failed (${requestsResponse.status}): ${requestsText}`)
    if (!quotesResponse.ok) throw new Error(`MCS_Taxi_Service_Quote fetch failed (${quotesResponse.status}): ${quotesText}`)

    const taxiRecords: TaxiRecord[] = taxiText ? (JSON.parse(taxiText).records || []) : []
    const requests: TaxiServiceRequest[] = requestsText ? (JSON.parse(requestsText).records || []) : []
    const quotes: TaxiServiceQuote[] = quotesText ? (JSON.parse(quotesText).records || []) : []
    const requestsById = new Map(
      requests.filter(serviceRequest => serviceRequest.IsActive !== false && serviceRequest.id != null)
        .map(serviceRequest => [String(serviceRequest.id), serviceRequest]),
    )
    const ratingsByDriver = new Map<string, number[]>()
    for (const quote of quotes) {
      if (quote.IsActive === false || !isAcceptedStatus(quote.MCS_Status)) continue
      const driverId = referenceId(quote.MCS_TaxiDriver_ID)
      const requestId = referenceId(quote.MCS_Taxi_Service_Request_ID)
      const serviceRequest = requestsById.get(requestId)
      const rating = Number(serviceRequest?.MCS_DriverRating ?? serviceRequest?.MCS_Rating ?? serviceRequest?.Rating ?? 0)
      if (!driverId || !serviceRequest || !Number.isFinite(rating) || rating <= 0) continue
      ratingsByDriver.set(driverId, [...(ratingsByDriver.get(driverId) || []), rating])
    }
    const allRecords = taxiRecords.map(record => {
      const ratings = ratingsByDriver.get(String(record.id)) || []
      const averageRating = ratings.length
        ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
        : 0
      return { ...record, Rating: Number(averageRating.toFixed(1)), reviewCount: ratings.length }
    })
    const wantedCountry = normalizeCountry(selectedCountry)
    const filteredRecords = selectedCountry === 'All'
      ? allRecords
      : allRecords.filter(record => normalizeCountry(getTaxiCountry(record)) === wantedCountry)
    const records = filteredRecords.slice(skipRecords, skipRecords + pageSize)

    return NextResponse.json({
      'page-count': Math.ceil(filteredRecords.length / pageSize),
      'records-size': records.length,
      'skip-records': skipRecords,
      'row-count': filteredRecords.length,
      'array-count': 0,
      country: selectedCountry,
      records,
    })
  } catch (error) {
    console.error('MCS_TaxiDriver fetch failed:', error)
    return NextResponse.json({ error: 'Could not load taxi drivers', records: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const signedUserId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
    if (!signedUserId) {
      return NextResponse.json({ error: 'Please sign in before registering as a taxi driver.' }, { status: 401 })
    }

    const input = await request.json()
    const vehicle = String(input.MCS_Vehicle || '').trim()
    const vehicleType = String(input.MCS_VehicleType || '').trim()
    const baseFare = Number(input.MCS_BaseFare)
    const countryId = Number(typeof input.C_Country_ID === 'object' ? input.C_Country_ID?.id : input.C_Country_ID)
    const submittedCity = typeof input.C_City_ID === 'object' ? input.C_City_ID?.id : input.C_City_ID
    const submittedCityId = Number(submittedCity)
    const submittedCityName = String(input.city || (!Number.isFinite(submittedCityId) ? submittedCity : '') || '').trim()
    const phone = String(input.Phone || '').trim()
    const language = String(input.AD_Language || '').trim()
    const complementaryFood = String(input.MCS_ComplementoryFood || '').trim()
    const serviceAreaIds = Array.isArray(input.MCS_ServiceAreas)
      ? input.MCS_ServiceAreas.map(Number).filter((id: number) => Number.isFinite(id) && id > 0)
      : String(input.MCS_ServiceAreas || '').replace(/[<>]/g, '').split(',').map(Number).filter((id: number) => Number.isFinite(id) && id > 0)
    const serviceAreaNames = Array.isArray(input.serviceAreaNames)
      ? input.serviceAreaNames.map((name: unknown) => String(name).trim()).filter(Boolean)
      : []
    if (!vehicle || !vehicleType || !countryId || !phone || !language || serviceAreaIds.length === 0) {
      return NextResponse.json({ error: 'Vehicle, country, city, phone, language, and service areas are required.' }, { status: 400 })
    }
    if (!Number.isFinite(baseFare) || baseFare < 0) {
      return NextResponse.json({ error: 'Enter a valid base fare.' }, { status: 400 })
    }

    const token = await getAuthToken()
    const validationHeaders = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    const cityFilter = Number.isFinite(submittedCityId) && submittedCityId > 0
      ? `C_City_ID eq ${submittedCityId} and C_Country_ID eq ${countryId} and IsActive eq true`
      : `Name eq '${submittedCityName.replace(/'/g, "''")}' and C_Country_ID eq ${countryId} and IsActive eq true`
    const cityResponse = await fetch(`${API_URL}/models/C_City?$filter=${encodeURIComponent(cityFilter)}&$top=1`, {
      headers: validationHeaders,
      cache: 'no-store',
    })
    const cityData = cityResponse.ok ? await cityResponse.json() : { records: [] }
    const selectedCity = Array.isArray(cityData.records) ? cityData.records[0] : undefined
    const cityId = Number(selectedCity?.id)
    const cityName = String(selectedCity?.Name || submittedCityName).trim()
    if (!cityId) {
      return NextResponse.json({ error: 'Select a valid city for the selected country.' }, { status: 400 })
    }

    const escapedLanguage = language.replace(/'/g, "''")
    const languageFilter = encodeURIComponent(`AD_Language eq '${escapedLanguage}' and IsActive eq true`)
    const languageResponse = await fetch(`${API_URL}/models/AD_Language?$filter=${languageFilter}&$top=1`, {
      headers: validationHeaders,
      cache: 'no-store',
    })
    const languageData = languageResponse.ok ? await languageResponse.json() : { records: [] }
    if (!Array.isArray(languageData.records) || languageData.records.length === 0) {
      return NextResponse.json({ error: 'Select a valid language.' }, { status: 400 })
    }
    const payload = {
      AD_User_ID: String(signedUserId),
      IsActive: true,
      MCS_Vehicle: vehicle,
      MCS_VehicleType: vehicleType,
      MCS_BaseFare: baseFare,
      C_Country_ID: countryId,
      C_City_ID: cityId,
      Phone: phone,
      MCS_ComplementoryFood: complementaryFood,
      AD_Language: language,
      MCS_ServiceAreas: serviceAreaIds[0],
      Counter: 0,
      IsAvailable: true,
      ContactDescription: `New Driver · ${cityName} · ${serviceAreaNames.join(", ") || "Service areas selected"}`,
      MCS_IsVerified: false,
    }
    const response = await fetch(`${API_URL}/models/MCS_TaxiDriver`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const responseText = await response.text()
    let data: Record<string, unknown> = {}
    try { data = responseText ? JSON.parse(responseText) : {} } catch {}
    if (!response.ok) {
      const detail = String(data.message || data.error || responseText || `iDempiere returned ${response.status}`)
      return NextResponse.json({ error: detail }, { status: response.status })
    }
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('MCS_TaxiDriver create failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not register taxi driver' }, { status: 500 })
  }
}