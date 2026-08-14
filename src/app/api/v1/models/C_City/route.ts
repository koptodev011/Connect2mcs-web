import { NextResponse } from 'next/server'
import { fetchModel } from '@/lib/idempiere'

interface CityRecord {
  id: string | number
  Name?: string
  IsActive?: boolean
  C_Country_ID?: { id?: string | number; identifier?: string } | string | number
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countryIdParam = searchParams.get('countryId')
    const countryId = Number(countryIdParam)
    const hasCountry = Boolean(countryIdParam) && Number.isFinite(countryId) && countryId > 0
    const filter = hasCountry ? `C_Country_ID eq ${countryId}` : undefined
    const top = hasCountry ? 200 : 1000
    const cities = await fetchModel('C_City', filter, { top, orderby: 'Name' }) as CityRecord[]
    const records = cities
      .filter(city => city.IsActive !== false && city.Name?.trim())
      .map(city => {
        const country = typeof city.C_Country_ID === 'object' ? city.C_Country_ID : undefined
        return {
          id: String(city.id),
          name: city.Name!.trim(),
          countryId: country?.id != null ? String(country.id) : '',
          country: country?.identifier || '',
        }
      })

    return NextResponse.json({
      'page-count': 1,
      'records-size': records.length,
      'skip-records': 0,
      'row-count': records.length,
      'array-count': 0,
      countryId: hasCountry ? countryId : null,
      records,
    })
  } catch (error) {
    console.error('C_City fetch failed:', error)
    return NextResponse.json({ error: 'Could not load cities', records: [] }, { status: 500 })
  }
}