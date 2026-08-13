import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/idempiere'
const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'
export async function GET() {
  try {
    const query = new URLSearchParams({ '$filter': 'IsActive eq true', '$top': '500', '$orderby': 'ISO_Code' })
    const response = await fetch(API_URL + '/models/C_Currency?' + query.toString(), {
      headers: { Authorization: 'Bearer ' + await getAuthToken(), Accept: 'application/json' }, cache: 'no-store',
    })
    const responseText = await response.text()
    let data: Record<string, unknown> = {}
    try { data = responseText ? JSON.parse(responseText) : {} } catch {}
    if (!response.ok) return NextResponse.json({ error: String(data.message || data.error || responseText || 'Could not load currencies'), records: [] }, { status: response.status })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load currencies', records: [] }, { status: 500 })
  }
}
