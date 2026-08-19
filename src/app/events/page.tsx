'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { C } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Avatar, Btn, Card, ImgPh, PageHeader, Pill, SectionHead } from '@/components/primitives';
import type { SceneKind } from '@/components/Scenes';
import { calendarWeek, CalendarEvent } from '@/data/events';
import { HostEventModal } from '@/components/FormModals';
import { FullCalendarModal } from '@/components/FullCalendarModal';
import MarathiCalendarTab from '@/components/MarathiCalendarTab';
import styles from './page.module.css';

const fallbackCats = ['All'];
const PAGE_SIZE = 6;

export default function EventsPage() {
  const [eventsData, setEventsData] = useState<CalendarEvent[]>([]);
  const [cats, setCats] = useState<string[]>(fallbackCats);
  const [activeTab, setActiveTab] = useState<'events' | 'calendar'>('events');
  const [loading, setLoading] = useState(true);
  const [activeDate, setActiveDate] = useState<number | null>(null);
  const [activeCat, setActiveCat] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Upcoming');
  const [going, setGoing] = useState<Set<string>>(new Set());
  const [hostEventOpen, setHostEventOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const eventListRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const toggleRsvp = (eventId: string) => {
    setGoing((current) => {
      const next = new Set(current);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };
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

  const filtered = eventsData.filter(e => {
    const matchCat = activeCat === 'All' || e.cat === activeCat;
    const matchQ = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.where.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDate = activeDate === null || e.day === String(activeDate).padStart(2, '0');
    return matchCat && matchQ && matchDate;
  });

  const sortedEvents = [...filtered].sort((a, b) => {
    if (sortBy === 'Popular') return b.going - a.going;
    return 0;
  });

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleCount >= sortedEvents.length) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleCount(count => Math.min(count + PAGE_SIZE, sortedEvents.length));
      }
    }, {
      root: eventListRef.current,
      rootMargin: '0px 240px 0px 0px',
      threshold: 0.01,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sortedEvents.length, visibleCount]);

  const visibleEvents = sortedEvents.slice(0, visibleCount);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Events & Festivals"
        marathi="उत्सव"
        subtitle={`${loading ? '...' : eventsData.length} events worldwide · 12 near you this weekend`}
        actions={<></>}
      />

      <div className="events-view-tabs" role="tablist" aria-label="Events views">
        <button type="button" role="tab" aria-selected={activeTab === 'events'} className={activeTab === 'events' ? 'active' : ''} onClick={() => setActiveTab('events')}>Events</button>
        <button type="button" role="tab" aria-selected={activeTab === 'calendar'} className={activeTab === 'calendar' ? 'active' : ''} onClick={() => setActiveTab('calendar')}>Calendar</button>
      </div>

      <div className={activeTab === 'events' ? styles.eventsView : styles.hidden}>
        <Card pad={14} className={styles.searchCard}>
          <div className={styles.searchBox}>
            <Icon name="search" size={16} color={C.ink3}/>
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); eventListRef.current?.scrollTo({ left: 0 }); }}
              placeholder="Search events, festivals, workshops…"
              className={styles.searchInput}
            />
          </div>
        </Card>

        <div className={`event-category-scroll ${styles.categoryScroll}`}>
          {cats.map(c => (
            <Pill key={c} className={styles.categoryPill} active={activeCat === c} onClick={() => { setActiveCat(c); setVisibleCount(PAGE_SIZE); eventListRef.current?.scrollTo({ left: 0 }); }}>{c}</Pill>
          ))}
        </div>

        <Card pad={0}>
          <div className={styles.calendarHeader}>
            <div className={styles.calendarTitle}>May 2026 · Week {weekOffset === 0 ? 'of 4 May' : weekOffset > 0 ? `+${weekOffset}` : weekOffset}</div>
            <div className={styles.calendarActions}>
              <button onClick={() => setCalendarOpen(true)} className={styles.calendarLink}><Icon name="cal" size={14}/> Full calendar</button>
              <div className={styles.weekButtons}>
                <button onClick={() => setWeekOffset(w => w - 1)} className={styles.weekButton}><Icon name="chevL" size={14}/></button>
                <button onClick={() => setWeekOffset(w => w + 1)} className={styles.weekButton}><Icon name="chevR" size={14}/></button>
              </div>
            </div>
          </div>
          <div className={styles.calendarGrid}>
            {calendarWeek.map((d, i) => {
              let newD = d.d + (weekOffset * 7);
              if (newD > 31) newD -= 31;
              else if (newD <= 0) newD += 30;
              const isToday = weekOffset === 0 ? d.today : false;
              const isActive = activeDate === newD;
              const evCount = weekOffset === 0 ? d.ev : ((newD + weekOffset) % 4 === 0 ? 1 : 0);

              return (
                <div
                  key={i}
                  onClick={() => { setActiveDate(activeDate === newD ? null : newD); setVisibleCount(PAGE_SIZE); eventListRef.current?.scrollTo({ left: 0 }); }}
                  className={`${styles.calendarDay} ${i < 6 ? styles.calendarDayBorder : ''} ${isActive ? styles.activeDay : isToday ? styles.today : ''}`}
                >
                  <div className={styles.weekday}>{d.dy.toUpperCase()}</div>
                  <div className={`num ${styles.dayNumber} ${(isActive || isToday) ? styles.highlightedText : ''}`}>{newD}</div>
                  {evCount > 0
                    ? <div className={`${styles.eventCount} ${(isActive || isToday) ? styles.highlightedText : ''}`}>{evCount} event{evCount > 1 ? 's' : ''}</div>
                    : <div className={styles.noEvent}>—</div>
                  }
                </div>
              );
            })}
          </div>
        </Card>

        <div>
          <SectionHead
            title="Upcoming events"
            subtitle={`${sortedEvents.length} ${activeCat === 'All' ? 'event' : activeCat.toLowerCase()}${sortedEvents.length === 1 ? '' : 's'} · sorted by date`}
            action={
              <select value={sortBy} onChange={e => { setSortBy(e.target.value); setVisibleCount(PAGE_SIZE); eventListRef.current?.scrollTo({ left: 0 }); }} className={styles.sortSelect}>
                <option value="Upcoming">Sort: Upcoming</option>
                <option value="Popular">Sort: Popular</option>
              </select>
            }
          />
          <div ref={eventListRef} className="scroll-row">
            {loading ? (
              <div className={styles.listMessage}>Loading events from iDempiere...</div>
            ) : filtered.length === 0 ? (
              <Card pad={32} className={styles.emptyCard}>
                <div className={styles.emptyTitle}>No events match your criteria</div>
                <p className={styles.emptyText}>Try adjusting your filters.</p>
              </Card>
            ) : visibleEvents.map((e, index) => {
              const kind: SceneKind =
                e.cat === 'Music' ? 'music' :
                e.cat === 'Literary' ? 'study' :
                e.cat === 'Family' ? 'food' :
                e.cat === 'Cultural' ? 'dance' :
                'event';
              const isGoing = going.has(e.id);

              return (
                <Link key={`${e.id}-${index}`} href={`/events/${e.id}`} className={styles.eventLink}>
                  <Card pad={0} interactive className={styles.eventCard}>
                    {e.image ? (
                      <div className={styles.imageWrap}>
                        <img src={e.image} alt={e.title} className={styles.eventImage}/>
                        <div className={styles.imageDate}>
                          <div className={styles.imageMonth}>{e.month}</div>
                          <div className={styles.imageDay}>{e.day}</div>
                        </div>
                        {(e.free || e.price) && <div className={`${styles.priceBadge} ${e.free ? styles.freeBadge : styles.paidBadge}`}>{e.free ? 'FREE' : e.price}</div>}
                      </div>
                    ) : (
                      <ImgPh kind={kind} height={140} tone={e.tone}>
                        <div className={styles.placeholderDate}>
                          <div className={styles.placeholderMonth}>{e.month}</div>
                          <div className={`num ${styles.placeholderDay}`}>{e.day}</div>
                          <div className={styles.placeholderWeekday}>{e.wk}</div>
                        </div>
                        {(e.free || e.price) && <div className={`${styles.priceBadge} ${e.free ? styles.freeBadge : styles.paidBadge}`}>{e.free ? 'FREE' : e.price}</div>}
                      </ImgPh>
                    )}
                    <div className={styles.eventBody}>
                      {e.value && <div className={styles.eventValue}>{e.value}</div>}
                      <div className={styles.eventHeading}><h4 className={styles.eventTitle}>{e.title}</h4></div>
                      {e.organizer && <div className={styles.organizer}>By {e.organizer}</div>}
                      {e.fullDate && <div className={styles.fullDate}>{e.fullDate}</div>}
                      {e.desc && <div className={styles.description}>{e.desc}</div>}
                      <div className={styles.location}>
                        <Icon name="pin" size={13} color={C.ink3}/><span className={styles.ellipsis}>{e.where}{e.country && `, ${e.country}`}</span>
                      </div>
                      <div className={styles.eventFooter}>
                        {/* <div className={styles.attendees}>
                          {[0, 1, 2].map(j => <span key={j} className={j ? styles.avatarOverlap : styles.avatar}><Avatar name={['A', 'R', 'S'][j]} size={22}/></span>)}
                          <span className={styles.goingText}>
                            {e.going + (isGoing ? 1 : 0)} going{isGoing && <span className={styles.includingYou}> · incl. you</span>}
                          </span>
                        </div> */}
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
            {!loading && visibleCount < sortedEvents.length && (
              <div ref={loadMoreRef} className={styles.loadMore} aria-label="Loading more events"><span/></div>
            )}
          </div>
        </div>
        <HostEventModal isOpen={hostEventOpen} onClose={() => setHostEventOpen(false)}/>
        <FullCalendarModal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)}/>
      </div>
      {activeTab === 'calendar' && <MarathiCalendarTab/>}
    </div>
  );
}
