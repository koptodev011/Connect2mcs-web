import { NextResponse } from 'next/server'
import { fetchModel } from '@/lib/idempiere'

export async function GET() {
  try {
    const records = await fetchModel('MCS_MarketPlace_Category', 'IsActive eq true', { top: 100, orderby: 'Name' })
    return NextResponse.json({
      'page-count': 1,
      'records-size': records.length,
      'skip-records': 0,
      'row-count': records.length,
      'array-count': 0,
      records,
    })
  } catch (error) {
    console.error('MCS_MarketPlace_Category fetch failed:', error)
    return NextResponse.json({ error: 'Could not load marketplace categories', records: [] }, { status: 500 })
  }
}
