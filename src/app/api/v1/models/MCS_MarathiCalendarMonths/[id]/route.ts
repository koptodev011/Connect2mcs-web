import { NextResponse } from 'next/server'
import { fetchModelRecord } from '@/lib/idempiere'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const record = await fetchModelRecord('MCS_MarathiCalendarMonths', id)
    return NextResponse.json(record)
  } catch (error) {
    console.error('MCS_MarathiCalendarMonths record fetch failed:', error)
    return NextResponse.json({ error: 'Could not load calendar month' }, { status: 500 })
  }
}
