'use client';

import { useState, useEffect } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import Link from 'next/link';
import { Btn, Card, Pill, Tag, Avatar, ImgPh, SectionHead, PageHeader } from '@/components/primitives';
import type { SceneKind } from '@/components/Scenes';
import { calendarWeek, CalendarEvent } from '@/data/events';
import { HostEventModal } from '@/components/FormModals';
import { FullCalendarModal } from '@/components/FullCalendarModal';
import { useGlobalToast } from '@/components/primitives';

const fallbackCats = ['All'];

export default function EventsPage() {
  const [eventsData, setEventsData] = useState<CalendarEvent[]>([]);
  const [cats, setCats] = useState<string[]>(fallbackCats);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/data/events')
      .then(res => res.json())
      .then(data => {
        setEventsData(data);
        setLoading(false);
      })
      .catch(console.error);

    fetch('/api/v1/models/MCS_Event_Category')
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to load event categories')))
      .then((payload: unknown) => {
        const records = Array.isArray(payload)
          ? payload
          : (payload && typeof payload === 'object' && 'records' in payload
            ? (payload as { records?: unknown[] }).records || []
            : []);
        const categoryNames = records
          .filter((record): record is Record<string, unknown> =>
            !!record && typeof record === 'object' && record.IsActive !== false
          )
          .map(record => String(record.Name || record.Value || '').trim())
          .filter(Boolean);

        if (categoryNames.length) setCats(['All', ...Array.from(new Set(categoryNames))]);
      })
      .catch(console.error);
  }, []);

  const [activeDate, setActiveDate] = useState<number | null>(null);
  const [activeCat, setActiveCat] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Upcoming');
  const [going, setGoing] = useState<Set<string>>(new Set());
  const [hostEventOpen, setHostEventOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const toast = useGlobalToast();
  const toggleRsvp = (id: string) => setGoing(s => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  function addToCalendar(title: string, date: string, location: string) {
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${date.replace(/-/g,'')}T110000Z\nLOCATION:${location}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${title}.ics`; a.click();
    toast.add('Calendar file downloaded!', 'success');
  }

  const filtered = eventsData.filter(e => {
    const matchCat = activeCat === 'All' || e.cat === activeCat;
    const matchQ = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.where.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDate = activeDate === null || e.day === String(activeDate).padStart(2, '0');
    return matchCat && matchQ && matchDate;
  });

  const sortedEvents = [...filtered].sort((a, b) => {
    if (sortBy === 'Popular') return b.going - a.going;
    return 0; // Upcoming default
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Events & Festivals"
        marathi="उत्सव"
        subtitle={`${loading ? '...' : eventsData.length} events worldwide · 12 near you this weekend`}
        actions={<>
        </>}
      />

      {/* Featured banner */}
      

      <Card pad={14} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 'min(100%, 200px)', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: C.bgDeep, borderRadius: 10 }}>
          <Icon name="search" size={16} color={C.ink3}/>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, festivals, workshops…" 
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit' }}
          />
        </div>
      </Card>

      <div className="event-category-scroll" style={{
          display: 'flex',
          gap: 6,
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          flexWrap: 'nowrap',
          paddingBottom: 6,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {cats.map(c => <Pill key={c} style={{ flex: '0 0 auto' }} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</Pill>)}
      </div>

      {/* Calendar strip */}
      <Card pad={0}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>May 2026 · Week {weekOffset === 0 ? 'of 4 May' : weekOffset > 0 ? `+${weekOffset}` : weekOffset}</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => setCalendarOpen(true)} style={{ background: 'none', border: 'none', color: C.saffronDk, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="cal" size={14}/> Full calendar</button>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setWeekOffset(w => w - 1)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.lineMid}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevL" size={14}/></button>
              <button onClick={() => setWeekOffset(w => w + 1)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.lineMid}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevR" size={14}/></button>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {calendarWeek.map((d, i) => {
            let newD = d.d + (weekOffset * 7);
            if (newD > 31) newD -= 31;
            else if (newD <= 0) newD += 30;
            const isToday = weekOffset === 0 ? d.today : false;
            const isActive = activeDate === newD;
            const evCount = weekOffset === 0 ? d.ev : (Math.random() > 0.7 ? 1 : 0); // Fake events for other weeks
            
            return (
            <div 
              key={i} 
              onClick={() => setActiveDate(activeDate === newD ? null : newD)}
              style={{ 
                padding: '14px 12px', textAlign: 'center', 
                borderRight: i < 6 ? `1px solid ${C.line}` : 'none', 
                background: isActive ? C.saffronLt : isToday ? C.bgDeep : 'transparent',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: 10.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.08em' }}>{d.dy.toUpperCase()}</div>
              <div className="num" style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: (isActive || isToday) ? C.saffronDk : C.ink, marginTop: 4 }}>{newD}</div>
              {evCount > 0
                ? <div style={{ marginTop: 6, fontSize: 10.5, color: (isActive || isToday) ? C.saffronDk : C.ink3, fontWeight: 700 }}>{evCount} event{evCount > 1 ? 's' : ''}</div>
                : <div style={{ marginTop: 6, fontSize: 10.5, color: C.ink4 }}>—</div>
              }
            </div>
            );
          })}
        </div>
      </Card>

      {/* Event list */}
      <div>
        <SectionHead
          title="Upcoming events"
          subtitle={`${sortedEvents.length} ${activeCat === 'All' ? 'event' : activeCat.toLowerCase()}${sortedEvents.length === 1 ? '' : 's'} · sorted by date`}
          action={
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ appearance: 'none', background: 'transparent', border: 'none', color: C.saffronDk, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
              <option value="Upcoming">Sort: Upcoming</option>
              <option value="Popular">Sort: Popular</option>
            </select>
          }
        />
        {/* Events list */}
        <div className="scroll-row">
          {loading ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', minWidth: '100%', color: C.ink3, fontSize: 13 }}>
              Loading events from iDempiere...
            </div>
          ) : filtered.length === 0 ? (
            <Card pad={32} style={{ textAlign: 'center', minWidth: '100%' }}>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink }}>No events match your criteria</div>
              <p style={{ margin: '8px 0 16px', fontSize: 13, color: C.ink3 }}>Try adjusting your filters.</p>
            </Card>
          ) : sortedEvents.map((e, index) => {
            const kind: SceneKind =
              e.cat === 'Music' ? 'music' :
              e.cat === 'Literary' ? 'study' :
              e.cat === 'Family' ? 'food' :
              e.cat === 'Cultural' ? 'dance' :
              'event';
            const isGoing = going.has(e.id);
            return (
            <Link key={`${e.id}-${index}`} href={`/events/${e.id}`} style={{ textDecoration: 'none', display: 'flex' }}>
            <Card pad={0} interactive style={{ overflow: 'hidden', flex: 1 }}>
              {e.image ? (
                <div style={{ height: 140, position: 'relative' }}>
                  <img src={e.image} alt={e.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', padding: '4px 10px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.saffronDk, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{e.month}</div>
                    <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.1, marginTop: -2 }}>{e.day}</div>
                  </div>
                  {(e.free || e.price) && (
                    <div style={{ position: 'absolute', top: 14, right: 14, background: e.free ? C.green : C.ink, color: '#fff', padding: '6px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                      {e.free ? 'FREE' : e.price}
                    </div>
                  )}
                </div>
              ) : (
                <ImgPh kind={kind} height={140} tone={e.tone}>
                  <div style={{ position: 'absolute', top: 14, left: 14, background: '#fff', borderRadius: 10, padding: '8px 10px', textAlign: 'center', minWidth: 58, boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
                    <div style={{ fontSize: 10, color: C.saffronDk, fontWeight: 700, letterSpacing: '0.1em' }}>{e.month}</div>
                    <div className="num" style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: C.ink, lineHeight: 1, marginTop: 2 }}>{e.day}</div>
                    <div style={{ fontSize: 10, color: C.ink3, fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{e.wk}</div>
                  </div>
                  {(e.free || e.price) && (
                    <div style={{ position: 'absolute', top: 14, right: 14, background: e.free ? C.green : C.ink, color: '#fff', padding: '6px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                      {e.free ? 'FREE' : e.price}
                    </div>
                  )}
                </ImgPh>
              )}
              <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                {e.value && <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{e.value}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: '4px 0 0', fontSize: 15.5, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{e.title}</h4>
                </div>
                {e.organizer && <div style={{ fontSize: 11, color: C.ink3, marginTop: 4, fontWeight: 600 }}>By {e.organizer}</div>}
                {e.fullDate && <div style={{ fontSize: 11, color: C.ink3, marginTop: 4, fontWeight: 500 }}>{e.fullDate}</div>}
                {e.desc && <div style={{ fontSize: 12, color: C.ink2, marginTop: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.desc}</div>}
                <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: 12.5, color: C.ink3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="pin" size={13} color={C.ink3}/> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.where}{e.country && `, ${e.country}`}</span>
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {[0,1,2].map(j => <Avatar key={j} name={['A','R','S'][j]} size={22} style={{ marginLeft: j ? -7 : 0, fontSize: 9, border: '2px solid #fff' }}/>)}
                    <span style={{ fontSize: 11.5, color: C.ink3, marginLeft: 7, fontWeight: 600 }}>
                      {e.going + (isGoing ? 1 : 0)} going{isGoing && <span style={{ color: C.green }}> · incl. you</span>}
                    </span>
                  </div>
                  {e.link ? (
                    <Btn
                      kind="soft"
                      size="sm"
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        window.open(e.link, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      RSVP ↗
                    </Btn>
                  ) : (
                    <Btn
                      kind={isGoing ? 'primary' : 'soft'}
                      size="sm"
                      onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); toggleRsvp(e.id); }}
                    >
                      {isGoing ? 'Going ✓' : 'RSVP'}
                    </Btn>
                  )}
                </div>
              </div>
            </Card>
            </Link>
            );
          })}
        </div>
      </div>
      <HostEventModal isOpen={hostEventOpen} onClose={() => setHostEventOpen(false)}/>
      <FullCalendarModal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)}/>
    </div>
  );
}
