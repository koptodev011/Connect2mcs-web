import { NextResponse } from 'next/server'
import { fetchModel } from '@/lib/idempiere'

export async function GET() {
  try {
    const records = await fetchModel('MCS_MarathiCalendarMonths', 'IsActive eq true', { top: 100 })
    return NextResponse.json({ 'page-count': 1, 'records-size': 100, 'skip-records': 0, 'row-count': records.length, 'array-count': 0, records })
  } catch (error) {
    console.error('MCS_MarathiCalendarMonths fetch failed:', error)
    return NextResponse.json({ error: 'Could not load Marathi calendar months', records: [] }, { status: 500 })
  }
}
