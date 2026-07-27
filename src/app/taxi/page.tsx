'use client';

import { useState, useEffect } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, Avatar, SectionHead, PageHeader, Rating, useGlobalToast } from '@/components/primitives';
import { TaxiDriver, taxiCities, taxiSuggestions } from '@/data/taxi';
import { toneBg, toneColor } from '@/lib/tones';
import { BookModal, BecomeProviderModal, FilterModal, InfoModal } from '@/components/FormModals';

export default function TaxiPage() {
  const [driversData, setDriversData] = useState<TaxiDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/taxi')
      .then(res => res.json())
      .then(data => {
        setDriversData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const [activeCity, setActiveCity] = useState('All cities');
  const [contacted, setContacted] = useState<Set<string>>(new Set());
  const [pickup, setPickup] = useState('Boston, MA');
  const [destination, setDestination] = useState('');
  const [when, setWhen] = useState('Now');
  const [date, setDate] = useState('Today');
  const [searched, setSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [sortBy, setSortBy] = useState('Rating');

  const filtered = activeCity === 'All cities'
    ? driversData
    : driversData.filter(d => d.city === activeCity);

  const sortedDrivers = [...filtered].sort((a, b) => {
    if (sortBy === 'Rating') return b.rating - a.rating;
    if (sortBy === 'Trips') return b.trips - a.trips;
    return 0;
  });

  const availableCount = filtered.filter(d => d.available).length;

  function handleSearch() {
    if (destination.trim() && pickup.trim()) {
      setSearched(true);
      setShowSuggestions(false);
    }
  }

  function handleSwap() {
    const temp = pickup;
    setPickup(destination);
    setDestination(temp);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="NRI Taxi"
        marathi="टॅक्सी"
        subtitle={`${loading ? '...' : driversData.length} community drivers · vetted by Mandal network · book directly`}
        actions={<>
          <Btn kind="ghost" size="md" iconL="filter" onClick={() => setFilterOpen(true)}>Filters</Btn>
          <Btn kind="dark"  size="md" iconL="plus" onClick={() => setRegisterOpen(true)}>Register as driver</Btn>
        </>}
      />

      {/* Booking widget */}
      <Card pad={0} style={{ overflow: 'visible', border: `1px solid ${C.line}`, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        {/* Widget header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Plan your ride</div>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>
              Where would you like to go?
            </div>
          </div>
          <Tag color={C.green} bg={C.greenLt} style={{ fontSize: 11, fontWeight: 700 }}>
            ● {availableCount} drivers online
          </Tag>
        </div>

        <div style={{ padding: '20px 24px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Route inputs */}
          <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
            {/* Pickup */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
              background: C.bgDeep, borderRadius: 12, border: `1px solid ${C.line}`,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: C.greenLt,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="pin" size={16} color={C.green}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Pickup</div>
                <input
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                  placeholder="Pickup location"
                  style={{
                    border: 'none', background: 'transparent', outline: 'none',
                    fontSize: 14, fontWeight: pickup ? 700 : 500,
                    color: pickup ? C.ink : C.ink3,
                    fontFamily: 'inherit', width: '100%',
                  }}
                />
              </div>
            </div>

            {/* Swap button */}
            <button style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: '#fff', border: `1px solid ${C.line}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16, color: C.ink3,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }} onClick={handleSwap}>
              ⇄
            </button>

            {/* Destination */}
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                background: '#fff', borderRadius: 12,
                border: `1.5px solid ${destination ? C.saffron : C.line}`,
                boxShadow: destination ? `0 0 0 3px rgba(226,106,31,0.08)` : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: destination ? '#FFE9D6' : C.bgDeep,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}>
                  <Icon name="search" size={16} color={destination ? C.saffronDk : C.ink3}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Destination</div>
                  <input
                    value={destination}
                    onChange={e => { setDestination(e.target.value); setSearched(false); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="Where to?"
                    style={{
                      border: 'none', background: 'transparent', outline: 'none',
                      fontSize: 14, fontWeight: destination ? 700 : 500,
                      color: destination ? C.ink : C.ink3,
                      fontFamily: 'inherit', width: '100%',
                    }}
                  />
                </div>
                {destination && (
                  <button
                    onClick={() => { setDestination(''); setSearched(false); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: C.ink3, fontSize: 16, lineHeight: 1, flexShrink: 0 }}
                  >×</button>
                )}
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                  background: '#fff', border: `1px solid ${C.line}`,
                  borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  overflow: 'hidden', zIndex: 20,
                }}>
                  <div style={{ padding: '10px 14px 6px', fontSize: 10, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Popular destinations
                  </div>
                  {taxiSuggestions.map(s => (
                    <button
                      key={s}
                      onMouseDown={() => { setDestination(s); setShowSuggestions(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 14px', border: 'none',
                        background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                        textAlign: 'left',
                      }}
                      className="nav-int"
                    >
                      <Icon name="pin" size={14} color={C.ink3}/>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{s}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date, time, CTA */}
          <div className="mob-stack" style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 2 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              background: C.bgDeep, borderRadius: 10, border: `1px solid ${C.line}`, flex: 1,
            }}>
              <Icon name="cal" size={15} color={C.ink3}/>
              <select
                value={date} onChange={e => setDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: 'inherit', cursor: 'pointer', flex: 1 }}
              >
                <option>Today</option>
                <option>Tomorrow</option>
                <option>This weekend</option>
              </select>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              background: C.bgDeep, borderRadius: 10, border: `1px solid ${C.line}`, flex: 1,
            }}>
              <Icon name="clock" size={15} color={C.ink3}/>
              <select
                value={when} onChange={e => setWhen(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: 'inherit', cursor: 'pointer', flex: 1 }}
              >
                <option>Now</option>
                <option>In 1 hour</option>
                <option>Morning (6–10 AM)</option>
                <option>Afternoon (12–4 PM)</option>
                <option>Evening (5–9 PM)</option>
              </select>
            </div>
            <Btn
              kind={destination ? 'primary' : 'soft'}
              size="md"
              onClick={handleSearch}
            >
              {searched ? 'Update search' : 'Find drivers'}
            </Btn>
          </div>

          {/* Search result banner */}
          {searched && destination && (
            <div className="mob-stack" style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              background: 'linear-gradient(90deg, #FFF8EB 0%, #FFF3E0 100%)',
              border: `1px solid rgba(184,79,18,0.18)`, borderRadius: 10,
              marginTop: 4,
            }}>
              <Icon name="verify" size={18} color={C.saffron}/>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>
                  {pickup} → {destination}
                </span>
                <span style={{ fontSize: 13, color: C.ink2, fontWeight: 500, marginLeft: 8 }}>
                  · {date.toLowerCase()} · {when.toLowerCase()}
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>
                {availableCount} drivers available
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Editorial banner */}
      <div className="mob-stack" style={{
        background: 'linear-gradient(110deg, #0F0E0C 0%, #3A342B 60%, #5A4A34 100%)',
        borderRadius: 18, padding: '28px 36px', color: '#fff', position: 'relative', overflow: 'hidden',
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center',
      }}>
        <svg style={{ position: 'absolute', top: -30, right: -30, opacity: 0.1 }} width="260" height="260" viewBox="0 0 260 260" aria-hidden="true">
          <g fill="none" stroke="#fff" strokeWidth="1">
            <circle cx="130" cy="130" r="110"/><circle cx="130" cy="130" r="82"/><circle cx="130" cy="130" r="54"/>
          </g>
        </svg>
        <div style={{ position: 'relative' }}>
          <Tag color="#FFD89C" bg="rgba(255,216,156,0.15)">● Community-verified drivers</Tag>
          <h2 style={{ margin: '12px 0 8px', fontFamily: F.display, fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Ride with someone who speaks<br/>your language.
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500, maxWidth: 520, lineHeight: 1.55 }}>
            All drivers are Mandal-verified community members. Chat in Marathi, share the journey.
          </p>
        </div>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
          {[['🛬 Airport transfers','Fast & fixed rate'],['🏙️ City rides','Hourly & per mile'],['👨‍👩‍👧 Group travel','Minivans available']].map(([t, s], i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{t}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginTop: 2 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* City filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {taxiCities.map(c => (
          <Pill key={c} active={activeCity === c} onClick={() => setActiveCity(c)}>{c}</Pill>
        ))}
      </div>

      {/* Driver grid */}
      <section>
        <SectionHead
          title={searched && destination ? `Drivers for your route` : 'Available drivers'}
          subtitle={searched && destination
            ? `${availableCount} available · ${pickup} → ${destination} · ${date.toLowerCase()}`
            : `Showing ${filtered.length} driver${filtered.length === 1 ? '' : 's'} · ${activeCity}`}
          action={
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                appearance: 'none', border: 'none', background: 'transparent',
                fontSize: 13, fontWeight: 600, color: C.saffronDk, cursor: 'pointer', outline: 'none',
                fontFamily: 'inherit', paddingRight: 4
              }}
            >
              <option value="Rating">Sort: Rating</option>
              <option value="Trips">Sort: Trips</option>
            </select>
          }
        />
        {loading ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: C.ink3, fontSize: 13 }}>
            Loading drivers from iDempiere...
          </div>
        ) : filtered.length === 0 ? (
          <Card pad={32} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink }}>No drivers in this city yet</div>
            <p style={{ margin: '8px 0 16px', fontSize: 13, color: C.ink3, fontWeight: 500 }}>Be the first to register.</p>
            <Btn kind="primary" size="md" iconL="plus" onClick={() => setRegisterOpen(true)}>Register as driver</Btn>
          </Card>
        ) : (
          <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {sortedDrivers.map((d, index) => {
              const isContacted = contacted.has(d.id);
              return (
                <Card key={`${d.id}-${index}`} pad={0} style={{ overflow: 'hidden' }}>
                  {/* Tone header strip */}
                  <div style={{ height: 6, background: toneBg[d.tone], borderBottom: `1px solid ${toneColor[d.tone]}22` }}/>
                  <div style={{ padding: '18px 18px 16px' }}>
                    {/* Driver header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar name={d.name} size={52} style={{ fontSize: 18 }}/>
                        <span style={{
                          position: 'absolute', bottom: 0, right: 0,
                          width: 14, height: 14, borderRadius: '50%',
                          background: d.available ? C.green : C.ink4,
                          border: '2px solid #fff',
                        }}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>{d.name}</div>
                        <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, marginTop: 2 }}>
                          {d.city} · {d.mandal}
                        </div>
                        <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Rating value={d.rating}/>
                          <span style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>{d.trips.toLocaleString()} trips</span>
                        </div>
                      </div>
                      <div style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                        padding: '4px 8px', borderRadius: 999,
                        background: d.available ? C.greenLt : C.bgDeep,
                        color: d.available ? C.green : C.ink4,
                      }}>
                        {d.available ? '● ONLINE' : '○ OFFLINE'}
                      </div>
                    </div>

                    {/* Vehicle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: C.bgDeep, borderRadius: 10, marginBottom: 12 }}>
                      <Icon name="car" size={18} color={toneColor[d.tone]}/>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{d.vehicle}</div>
                        <div style={{ fontSize: 11, color: C.ink3, fontWeight: 600, marginTop: 1 }}>{d.type}</div>
                      </div>
                    </div>

                    {/* Coverage */}
                    <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginBottom: 10, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <Icon name="pin" size={13} color={C.ink3}/>
                      <span>{d.areas}</span>
                    </div>

                    {/* Languages */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                      {d.langs.map(l => (
                        <Tag key={l} color={C.ink2} bg={C.bgDeep}
                          style={l === 'मराठी' ? { fontFamily: F.deva, textTransform: 'none', letterSpacing: 0, fontSize: 11 } : {}}>
                          {l}
                        </Tag>
                      ))}
                    </div>

                    {/* Note */}
                    <div style={{ fontSize: 12, color: C.ink3, fontStyle: 'italic', marginBottom: 14, lineHeight: 1.4 }}>"{d.note}"</div>

                    {/* Rates + CTA */}
                    <div style={{ paddingTop: 12, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: C.saffronDk }}>{d.rate}</span>
                        <span style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, marginLeft: 6 }}>{d.base}</span>
                      </div>
                      <Btn
                        kind={isContacted ? 'soft' : 'primary'}
                        size="sm"
                        onClick={() => { setContacted(s => { const n = new Set(s); n.has(d.id) ? n.delete(d.id) : n.add(d.id); return n; }); setSelectedDriver(d.name); setBookOpen(true); }}
                      >
                        {isContacted ? 'Requested ✓' : 'Book ride'}
                      </Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Register CTA */}
      <Card pad={28} style={{ background: 'linear-gradient(135deg, #FFF8EB 0%, #FFE9D6 60%, #FFD9A6 100%)', border: `1px solid rgba(184,137,60,0.18)` }}>
        <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Drive with your community</div>
            <h3 style={{ margin: 0, fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              Are you a driver? List yourself for free.
            </h3>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: C.ink2, fontWeight: 500, lineHeight: 1.5, maxWidth: 560 }}>
              Verified community members can list their driving services. No commission — passengers contact you directly.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn kind="primary" size="md" iconL="plus" onClick={() => setRegisterOpen(true)}>Post requirement</Btn>
            <Btn kind="ghost" size="md" onClick={() => setInfoOpen(true)}>How it works</Btn>
          </div>
        </div>
      </Card>
      
      <BecomeProviderModal isOpen={registerOpen} onClose={() => setRegisterOpen(false)}/>
      <FilterModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
      <InfoModal 
        isOpen={infoOpen} onClose={() => setInfoOpen(false)} 
        title="How it works" 
        content={
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li><b>Find a driver:</b> Browse trusted Marathi drivers for local trips or intercity transfers.</li>
            <li><b>Post a requirement:</b> Need a ride to the airport? Let the community know.</li>
            <li><b>Direct communication:</b> Connect and negotiate terms directly with the driver.</li>
            <li><b>Community trust:</b> All drivers are verified members of the local mandal network.</li>
          </ul>
        } 
      />
      <BookModal
        isOpen={bookOpen} onClose={() => setBookOpen(false)}
        title={`Book Ride with ${selectedDriver}`} marathi="बुकिंग"
        submitLabel="Send booking request"
        fields={[
          { key: 'pickup', label: 'Pickup address', placeholder: 'Current location or address' },
          { key: 'dropoff', label: 'Drop-off address', placeholder: 'Airport / Hotel / City' },
          { key: 'date', label: 'Pickup date & time', placeholder: 'Tomorrow at 10 AM' },
          { key: 'passengers', label: 'Passengers & Luggage', placeholder: '2 adults, 2 large bags' },
        ]}
      />
    </div>
  );
}
