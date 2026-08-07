'use client'

import { useEffect, useMemo, useState } from 'react'
import Icon from '@/components/Icon'
import { C, F } from '@/lib/tokens'

type ModelRef = { id?: number; identifier?: string }
type CalendarRecord = { id?: number; Name?: string; Value?: string; IsActive?: boolean }
type MonthRecord = {
  id?: number
  Name?: string
  Value?: string
  IsActive?: boolean
  MCS_Day?: string
  Logo_ID?: { data?: string; file_name?: string }
  MCS_MarathiCalendar_ID?: ModelRef
}

const monthDetails: Record<string, { marathi: string; lunar: string; order: number }> = {
  january: { marathi: 'जानेवारी', lunar: 'पौष / माघ', order: 1 },
  february: { marathi: 'फेब्रुवारी', lunar: 'माघ / फाल्गुन', order: 2 },
  march: { marathi: 'मार्च', lunar: 'फाल्गुन / चैत्र', order: 3 },
  april: { marathi: 'एप्रिल', lunar: 'चैत्र / वैशाख', order: 4 },
  may: { marathi: 'मे', lunar: 'वैशाख / ज्येष्ठ', order: 5 },
  june: { marathi: 'जून', lunar: 'ज्येष्ठ / आषाढ', order: 6 },
  july: { marathi: 'जुलै', lunar: 'आषाढ / श्रावण', order: 7 },
  august: { marathi: 'ऑगस्ट', lunar: 'श्रावण / भाद्रपद', order: 8 },
  september: { marathi: 'सप्टेंबर', lunar: 'भाद्रपद / आश्विन', order: 9 },
  october: { marathi: 'ऑक्टोबर', lunar: 'आश्विन / कार्तिक', order: 10 },
  november: { marathi: 'नोव्हेंबर', lunar: 'कार्तिक / मार्गशीर्ष', order: 11 },
  december: { marathi: 'डिसेंबर', lunar: 'मार्गशीर्ष / पौष', order: 12 },
  chaitra: { marathi: 'चैत्र', lunar: 'चैत्र', order: 13 },
  vaishakh: { marathi: 'वैशाख', lunar: 'वैशाख', order: 14 },
  jyeshtha: { marathi: 'ज्येष्ठ', lunar: 'ज्येष्ठ', order: 15 },
  ashadh: { marathi: 'आषाढ', lunar: 'आषाढ', order: 16 },
  shravan: { marathi: 'श्रावण', lunar: 'श्रावण', order: 17 },
  bhadrapad: { marathi: 'भाद्रपद', lunar: 'भाद्रपद', order: 18 },
}

function recordsFrom(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
  if (payload && typeof payload === 'object' && 'records' in payload) {
    const records = (payload as { records?: unknown[] }).records || []
    return records.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
  }
  return []
}

export default function MarathiCalendarTab() {
  const [calendars, setCalendars] = useState<CalendarRecord[]>([])
  const [months, setMonths] = useState<MonthRecord[]>([])
  const [selectedCalendar, setSelectedCalendar] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<MonthRecord | null>(null)
  const [monthLoading, setMonthLoading] = useState(false)
  const [monthError, setMonthError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/models/MCS_MarathiCalendar').then(response => response.ok ? response.json() : Promise.reject(new Error('Calendar list failed'))),
      fetch('/api/v1/models/MCS_MarathiCalendarMonths').then(response => response.ok ? response.json() : Promise.reject(new Error('Calendar months failed'))),
    ])
      .then(([calendarPayload, monthPayload]) => {
        const calendarRows = recordsFrom(calendarPayload).filter(row => row.IsActive !== false) as CalendarRecord[]
        const monthRows = recordsFrom(monthPayload).filter(row => row.IsActive !== false) as MonthRecord[]
        setCalendars(calendarRows)
        setMonths(monthRows)
        if (calendarRows[0]?.id) setSelectedCalendar(String(calendarRows[0].id))
      })
      .catch(() => setError('Calendar data could not be loaded.'))
      .finally(() => setLoading(false))
  }, [])

  const visibleMonths = useMemo(() => {
    const selectedId = Number(selectedCalendar)
    const linked = months.filter(month => month.MCS_MarathiCalendar_ID?.id === selectedId)
    const source = linked.length ? linked : months
    const unique = new Map<string, MonthRecord>()
    source.forEach(month => {
      const value = String(month.Value || month.Name || '').trim()
      if (value && !unique.has(value.toLowerCase())) unique.set(value.toLowerCase(), month)
    })
    return [...unique.values()].sort((a, b) => {
      const aKey = String(a.Value || a.Name || '').toLowerCase()
      const bKey = String(b.Value || b.Name || '').toLowerCase()
      return (monthDetails[aKey]?.order || 99) - (monthDetails[bKey]?.order || 99)
    })
  }, [months, selectedCalendar])

  const openMonth = async (month: MonthRecord) => {
    if (!month.id) return
    setSelectedMonth(month)
    setMonthError('')
    setMonthLoading(true)
    try {
      const response = await fetch(`/api/v1/models/MCS_MarathiCalendarMonths/${month.id}`)
      if (!response.ok) throw new Error('Month request failed')
      const record = await response.json() as MonthRecord
      setSelectedMonth(record)
    } catch {
      if (!month.Logo_ID?.data) setMonthError('This calendar month could not be loaded.')
    } finally {
      setMonthLoading(false)
    }
  }

  const monthImage = selectedMonth?.Logo_ID?.data
    ? (selectedMonth.Logo_ID.data.startsWith('data:')
      ? selectedMonth.Logo_ID.data
      : `data:${selectedMonth.Logo_ID.file_name?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'};base64,${selectedMonth.Logo_ID.data}`)
    : ''

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: C.ink, fontFamily: F.display, fontSize: 22 }}>पर्व निर्णय</h2>
        <select
          value={selectedCalendar}
          onChange={event => setSelectedCalendar(event.target.value)}
          aria-label="Select Marathi calendar"
          style={{ minWidth: 160, padding: '11px 36px 11px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 10, background: C.surface, color: C.ink, fontWeight: 700, outline: 'none' }}
        >
          {calendars.map(calendar => <option key={calendar.id} value={calendar.id}>{calendar.Name || calendar.Value || 'Calendar'}</option>)}
        </select>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: C.ink3 }}>Loading Marathi calendar…</div> :
        error ? <div style={{ padding: 28, textAlign: 'center', color: '#B42318' }}>{error}</div> :
        <div className="marathi-calendar-grid">
          {visibleMonths.map(month => {
            const value = String(month.Value || month.Name || '')
            const detail = monthDetails[value.toLowerCase()]
            return (
              <article key={`${selectedCalendar}-${month.id}-${value}`} className="marathi-month-card" role="button" tabIndex={0} onClick={() => openMonth(month)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') openMonth(month) }}>
                <div>
                  <h3>{detail?.marathi || value}</h3>
                  <p>{detail?.lunar || value}</p>
                </div>
                <Icon name="cal" size={22} color={C.saffron} />
                <span aria-hidden="true" />
              </article>
            )
          })}
        </div>
      }

      {selectedMonth && (
        <div className="calendar-month-modal" role="dialog" aria-modal="true" aria-label={`${selectedMonth.Value || selectedMonth.Name || 'Calendar'} month`} onClick={() => setSelectedMonth(null)}>
          <div className="calendar-month-dialog" onClick={event => event.stopPropagation()}>
            <div className="calendar-month-dialog-head">
              <div>
                <h3>{monthDetails[String(selectedMonth.Value || selectedMonth.Name || '').toLowerCase()]?.marathi || selectedMonth.Value || selectedMonth.Name}</h3>
                {selectedMonth.MCS_Day && <p>{selectedMonth.MCS_Day}</p>}
              </div>
              <button type="button" aria-label="Close calendar month" onClick={() => setSelectedMonth(null)}>×</button>
            </div>
            <div className="calendar-month-image-wrap">
              {monthLoading ? <div className="calendar-month-message">Loading calendar…</div> :
                monthError ? <div className="calendar-month-message error">{monthError}</div> :
                monthImage ? <img src={monthImage} alt={`${selectedMonth.Value || selectedMonth.Name || 'Calendar'} calendar`} /> :
                <div className="calendar-month-message">No calendar image is available for this month.</div>}
            </div>
          </div>
        </div>
      )}
    </section>  )
}
