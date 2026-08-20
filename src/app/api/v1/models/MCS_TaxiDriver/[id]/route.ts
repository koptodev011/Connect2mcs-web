import { NextRequest, NextResponse } from 'next/server'
import { fetchModelRecord, getAuthToken } from '@/lib/idempiere'
import { verifyFavoriteUser } from '@/lib/favorite-session'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'

type Reference = { id?: number | string }
type TaxiRecord = { AD_User_ID?: Reference | number | string }

function referenceId(value: Reference | number | string | undefined) {
  return Number(typeof value === 'object' && value !== null ? value.id : value)
}

async function authorizeOwner(request: NextRequest, driverId: number) {
  const signedUserId = verifyFavoriteUser(request.cookies.get('mcs_favorite_user')?.value)
  if (!signedUserId) {
    return { error: NextResponse.json({ error: 'Please sign in again.' }, { status: 401 }) }
  }
  const driver = (await fetchModelRecord('MCS_TaxiDriver', driverId)) as TaxiRecord
  if (referenceId(driver.AD_User_ID) !== signedUserId) {
    return {
      error: NextResponse.json(
        { error: 'You can only change the taxi driver profile you created.' },
        { status: 403 },
      ),
    }
  }
  return { signedUserId }
}

async function upstream(method: 'PUT' | 'DELETE', driverId: number, body?: unknown) {
  const response = await fetch(`${API_URL}/models/MCS_TaxiDriver/${driverId}`, {
    method,
    headers: {
      Authorization: `Bearer ${await getAuthToken()}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  const text = await response.text()
  let data: Record<string, unknown> = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {}
  if (!response.ok) {
    return {
      error: NextResponse.json(
        {
          error: String(
            data.message || data.error || text || `iDempiere returned ${response.status}`,
          ),
        },
        { status: response.status },
      ),
    }
  }
  return { data }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const driverId = Number((await context.params).id)
    if (!driverId) {
      return NextResponse.json({ error: 'Invalid taxi driver ID' }, { status: 400 })
    }

    const authorization = await authorizeOwner(request, driverId)
    if (authorization.error) return authorization.error

    const input = await request.json()
    const vehicle = String(input.MCS_Vehicle || '').trim()
    const vehicleType = String(input.MCS_VehicleType || '').trim()
    const baseFare = Number(input.MCS_BaseFare)
    const countryId = Number(
      typeof input.C_Country_ID === 'object' ? input.C_Country_ID?.id : input.C_Country_ID,
    )
    const submittedCity =
      typeof input.C_City_ID === 'object' ? input.C_City_ID?.id : input.C_City_ID
    const submittedCityId = Number(submittedCity)
    const submittedCityName = String(
      input.city || (!Number.isFinite(submittedCityId) ? submittedCity : '') || '',
    ).trim()
    const phone = String(input.Phone || '').trim()
    const language = String(input.AD_Language || '').trim()
    const complementaryFood = String(input.MCS_ComplementoryFood || '').trim()
    const isAvailable = input.IsAvailable !== false
    const serviceAreaIds = Array.isArray(input.MCS_ServiceAreas)
      ? input.MCS_ServiceAreas.map(Number).filter((id: number) => Number.isFinite(id) && id > 0)
      : String(input.MCS_ServiceAreas || '')
          .replace(/[<>]/g, '')
          .split(',')
          .map(Number)
          .filter((id: number) => Number.isFinite(id) && id > 0)
    const serviceAreaNames = Array.isArray(input.serviceAreaNames)
      ? input.serviceAreaNames.map((name: unknown) => String(name).trim()).filter(Boolean)
      : []

    if (!vehicle || !vehicleType || !countryId || !phone || !language || serviceAreaIds.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle, country, city, phone, language, and service areas are required.' },
        { status: 400 },
      )
    }
    if (!Number.isFinite(baseFare) || baseFare < 0) {
      return NextResponse.json({ error: 'Enter a valid base fare.' }, { status: 400 })
    }

    const token = await getAuthToken()
    const validationHeaders = { Authorization: `Bearer ${token}`, Accept: 'application/json' }

    const cityFilter = Number.isFinite(submittedCityId) && submittedCityId > 0
      ? `C_City_ID eq ${submittedCityId} and C_Country_ID eq ${countryId} and IsActive eq true`
      : `Name eq '${submittedCityName.replace(/'/g, "''")}' and C_Country_ID eq ${countryId} and IsActive eq true`
    const cityResponse = await fetch(
      `${API_URL}/models/C_City?$filter=${encodeURIComponent(cityFilter)}&$top=1`,
      { headers: validationHeaders, cache: 'no-store' },
    )
    const cityData = cityResponse.ok ? await cityResponse.json() : { records: [] }
    const selectedCity = Array.isArray(cityData.records) ? cityData.records[0] : undefined
    const cityId = Number(selectedCity?.id)
    const cityName = String(selectedCity?.Name || submittedCityName).trim()
    if (!cityId) {
      return NextResponse.json(
        { error: 'Select a valid city for the selected country.' },
        { status: 400 },
      )
    }

    const escapedLanguage = language.replace(/'/g, "''")
    const languageResponse = await fetch(
      `${API_URL}/models/AD_Language?$filter=${encodeURIComponent(
        `AD_Language eq '${escapedLanguage}' and IsActive eq true`,
      )}&$top=1`,
      { headers: validationHeaders, cache: 'no-store' },
    )
    const languageData = languageResponse.ok ? await languageResponse.json() : { records: [] }
    if (!Array.isArray(languageData.records) || languageData.records.length === 0) {
      return NextResponse.json({ error: 'Select a valid language.' }, { status: 400 })
    }

    const payload = {
      AD_User_ID: authorization.signedUserId,
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
      IsAvailable: isAvailable,
      ContactDescription: `New Driver · ${cityName} · ${serviceAreaNames.join(', ') || 'Service areas selected'}`,
    }

    const result = await upstream('PUT', driverId, payload)
    if (result.error) return result.error
    return NextResponse.json(result.data)
  } catch (error) {
    console.error('MCS_TaxiDriver update failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Could not update taxi driver profile',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const driverId = Number((await context.params).id)
    if (!driverId) {
      return NextResponse.json({ error: 'Invalid taxi driver ID' }, { status: 400 })
    }
    const authorization = await authorizeOwner(request, driverId)
    if (authorization.error) return authorization.error
    const result = await upstream('DELETE', driverId)
    if (result.error) return result.error
    return NextResponse.json({ success: true, id: driverId })
  } catch (error) {
    console.error('MCS_TaxiDriver delete failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Could not delete taxi driver profile',
      },
      { status: 500 },
    )
  }
}