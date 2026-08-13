import { NextResponse } from 'next/server'
import { fetchModel } from '@/lib/idempiere'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countryId = Number(searchParams.get('countryId'))
    if (!Number.isFinite(countryId) || countryId <= 0) {
      return NextResponse.json({ error: 'A valid countryId is required', records: [] }, { status: 400 })
    }

    const cities = await fetchModel('C_City', `C_Country_ID eq ${countryId}`, { top: 100, orderby: 'Name' })
    const records = cities
      .filter((city: { IsActive?: boolean; Name?: string }) => city.IsActive !== false && city.Name?.trim())
      .map((city: { id: string | number; Name: string }) => ({ id: String(city.id), name: city.Name.trim() }))

    return NextResponse.json({
      'page-count': 1,
      'records-size': records.length,
      'skip-records': 0,
      'row-count': records.length,
      'array-count': 0,
      countryId,
      records,
    })
  } catch (error) {
    console.error('C_City fetch failed:', error)
    return NextResponse.json({ error: 'Could not load cities', records: [] }, { status: 500 })
  }
}