import { NextResponse } from 'next/server'
import { fetchModel } from '@/lib/idempiere'

export async function GET() {
  try {
    const languages = await fetchModel('AD_Language', 'IsActive eq true', { top: 100, orderby: 'Name' })
    const records = languages
      .filter((language: { AD_Language?: string; Name?: string; IsActive?: boolean }) =>
        language.IsActive !== false && language.AD_Language?.trim() && language.Name?.trim())
      .map((language: { AD_Language: string; Name: string }) => ({
        code: language.AD_Language.trim(),
        name: language.Name.trim(),
      }))
    return NextResponse.json({
      'records-size': records.length,
      'row-count': records.length,
      records,
    })
  } catch (error) {
    console.error('AD_Language fetch failed:', error)
    return NextResponse.json({ error: 'Could not load languages', records: [] }, { status: 500 })
  }
}
