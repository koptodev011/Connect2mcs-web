'use client';

import { useState, useEffect } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import Link from 'next/link';
import { Btn, Card, Pill, ImgPh, SectionHead, Rating, PageHeader, Tag, useGlobalToast } from '@/components/primitives';
import { Mandal } from '@/data/mandals';
import { AddMandalModal, FilterModal } from '@/components/FormModals';
import MandalMap from '@/components/MandalMap';

const filters = ['All', 'Near me', 'India', 'North America', 'Europe', 'Middle East', 'Asia-Pacific', 'Africa'];

export default function MandalsPage() {
  const [mandalsData, setMandalsData] = useState<Mandal[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useGlobalToast();
  
  useEffect(() => {
    fetch('/api/data/mandals')
      .then(res => res.json())
      .then(data => {
        setMandalsData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const [active, setActive] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [saved, setSaved] = useState<Set<string>>(new Set(['MML']));
  const [activeRegion, setActiveRegion] = useState('All');
  const [mapView, setMapView] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const toggleSave = (code: string) => setSaved(s => {
    const n = new Set(s);
    if (n.has(code)) n.delete(code); else n.add(code);
    return n;
  });

  const filtered = mandalsData.filter(m => {
    const matchCat = active === 'All' ? true : active === 'Near me' ? m.nearMe : m.region === active;
    const matchQ = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQ;
  });

  const featuredMandal = mandalsData.find(m => m.code === 'TX') || mandalsData[0] || null;
  const countryCount = new Set(mandalsData.map(m => m.country).filter(Boolean)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Maharashtra Mandals"
        marathi="महाराष्ट्र मंडळे"
        subtitle={`${loading ? '...' : mandalsData.length} organisations · ${loading ? '...' : countryCount} countries · ${loading ? '...' : mandalsData.reduce((acc, m) => acc + (m.members || 0), 0).toLocaleString()} active members`}
        actions={<>
          <Btn kind="ghost" size="md" iconL="filter" onClick={() => setFilterOpen(true)}>Filters</Btn>
          <Btn kind="dark" size="md" iconL="plus" onClick={() => setAddModalOpen(true)}>Add Mandal</Btn>
        </>}
      />

      <Card pad={14} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: C.bgDeep, borderRadius: 10 }}>
          <Icon name="search" size={16} color={C.ink3}/>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mandals by name or city…" 
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit' }}
          />
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {filters.map(f => <Pill key={f} active={active === f} onClick={() => setActive(f)}>{f}</Pill>)}
      </div>

      {/* Map + featured */}
      <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Global map view</div>
              <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 2 }}>
                {loading ? 'Loading map...' : `${mandalsData.length} Mandals plotted worldwide`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, background: C.bgDeep, padding: 3, borderRadius: 8 }}>
              <button onClick={() => setMapView(true)} style={{ padding: '6px 12px', background: mapView ? '#fff' : 'transparent', color: mapView ? C.ink : C.ink3, border: 'none', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
                <Icon name="map" size={14}/> Map
              </button>
              <button onClick={() => setMapView(false)} style={{ padding: '6px 12px', background: !mapView ? '#fff' : 'transparent', color: !mapView ? C.ink : C.ink3, border: 'none', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
                <Icon name="list" size={14}/> List
              </button>
            </div>
          </div>
          {mapView ? (
          <div style={{ position: 'relative', height: 380, background: 'linear-gradient(160deg, #FBF3DD 0%, #F4E5C2 100%)', backgroundImage: `radial-gradient(rgba(120,86,36,0.22) 0.7px, transparent 0.7px)`, backgroundSize: '14px 14px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, transform: `scale(${mapZoom})`, transformOrigin: 'center', transition: 'transform 0.2s' }}>
              <MandalMap mandals={mandalsData} />
            </div>
            <div style={{ position: 'absolute', bottom: 14, left: 14, background: '#fff', padding: '10px 14px', borderRadius: 12, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 14, fontSize: 11.5, fontWeight: 600, boxShadow: '0 2px 8px rgba(15,14,12,0.06)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: C.saffron, borderRadius: '50%' }}/>{loading ? '...' : mandalsData.length} Mandals</span>
              <span style={{ width: 1, height: 14, background: C.line }}/>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: C.brick, borderRadius: '50%' }}/>12 hosting now</span>
            </div>
            <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => setMapZoom(z => Math.min(z + 0.2, 2))} style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', border: `1px solid ${C.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: C.ink2, fontFamily: F.display }}>+</button>
              <button onClick={() => setMapZoom(z => Math.max(z - 0.2, 0.5))} style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', border: `1px solid ${C.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: C.ink2, fontFamily: F.display }}>−</button>
            </div>
          </div>
          ) : (
            <div style={{ height: 380, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mandalsData.slice(0,8).map((m, i) => (
                <Link key={i} href={`/mandals/${m.code}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${C.line}` }}>
                  <Icon name="map" size={16} color={C.saffron}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                    <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>{m.city}, {m.country}</div>
                  </div>
                  {m.rating > 0 && <div style={{ marginLeft: 'auto', flexShrink: 0 }}><Rating value={m.rating} /></div>}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card pad={0} style={{ overflow: 'hidden' }}>
          {!featuredMandal ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.ink3 }}>Loading featured mandal...</div>
          ) : (
            <>
              <ImgPh kind="mandal" height={160} tone={featuredMandal.tone} badge="Featured Mandal" src={featuredMandal.image}/>
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontFamily: F.display, fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: C.ink, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{featuredMandal.name}</h3>
                    <div style={{ fontSize: 12, color: C.ink3, marginTop: 4, fontWeight: 500 }}>{featuredMandal.city}, {featuredMandal.country} · Est. {featuredMandal.est}</div>
                  </div>
                  {featuredMandal.rating > 0 && <Rating value={featuredMandal.rating} size="lg"/>}
                </div>
                <p style={{ margin: '10px 0 12px', fontSize: 12.5, color: C.ink2, fontWeight: 500, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {featuredMandal.about || `A vibrant Marathi cultural body helping community members connect in ${featuredMandal.city}.`}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '10px 0', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                  {[
                    [featuredMandal.members.toLocaleString(), 'Members'],
                    [featuredMandal.events.toString(), 'Events/yr'],
                    [(new Date().getFullYear() - featuredMandal.est).toString(), 'Years old']
                  ].map(([n, l], i) => (
                    <div key={i} style={{ textAlign: 'center', borderRight: i < 2 ? `1px dashed ${C.line}` : 'none' }}>
                      <div className="num" style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.ink }}>{n}</div>
                      <div style={{ fontSize: 9.5, color: C.ink3, fontWeight: 600, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <Link href={`/mandals/${featuredMandal.code}`} style={{ flex: 1, textDecoration: 'none' }}>
                    <Btn kind="primary" size="md" full>Visit page</Btn>
                  </Link>
                  <Btn
                    kind={saved.has(featuredMandal.code) ? 'soft' : 'outline'}
                    size="md"
                    onClick={() => toggleSave(featuredMandal.code)}
                  >
                    <Icon name="heart" size={16} color={saved.has(featuredMandal.code) ? C.brick : C.ink}/>
                  </Btn>
                  <Btn kind="outline" size="md" onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + '/mandals/' + featuredMandal.code);
                    toast.add('Link copied to clipboard!', 'success');
                  }}><Icon name="share" size={16}/></Btn>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Directory grid */}
      <section>
        <SectionHead
          title="All Mandals"
          subtitle={`Showing ${filtered.length} of 184 · ${active}`}
          action="Sort: Distance"
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {loading ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', gridColumn: '1/-1', color: C.ink3, fontSize: 13 }}>
              Loading mandals from iDempiere...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', gridColumn: '1/-1' }}>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink }}>No mandals found</div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: C.ink3 }}>Try adjusting your search or filters.</p>
            </div>
          ) : filtered.map((m, index) => {
              const isSaved = saved.has(m.code);
              return (
            <Link key={`${m.code}-${index}`} href={`/mandals/${m.code}`} style={{ textDecoration: 'none', display: 'flex' }}>
            <Card pad={0} interactive style={{ overflow: 'hidden', position: 'relative', flex: 1 }}>
              <ImgPh kind="mandal" label={m.code} showLabel height={130} tone={m.tone} badge={m.hosting ? 'Hosting' : null} src={m.image}/>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave(m.code); }}
                    aria-label={isSaved ? 'Unsave Mandal' : 'Save Mandal'}
                    style={{
                      position: 'absolute', top: 10, right: 10, zIndex: 2,
                      width: 32, height: 32, borderRadius: '50%',
                      background: isSaved ? C.brick : 'rgba(255,255,255,0.92)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(15,14,12,0.15)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <Icon name="heart" size={15} color={isSaved ? '#fff' : C.ink2}/>
                  </button>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                          {m.home && <Tag color={C.blue} bg={'#DCE5F4'} style={{ flexShrink: 0, padding: '2px 4px', fontSize: 9 }}>Home</Tag>}
                          {m.nearMe && <Tag color={C.green} bg={C.greenLt} style={{ flexShrink: 0, padding: '2px 4px', fontSize: 9 }}>Near You</Tag>}
                        </div>
                        <div style={{ fontSize: 12, color: C.ink3, marginTop: 4, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.city}, {m.region ? `${m.region}, ` : ''}{m.country} · Est. {m.est}
                        </div>
                      </div>
                      {m.rating > 0 && <Rating value={m.rating}/>}
                    </div>
                    {m.about ? (
                      <div style={{ fontSize: 13, color: C.ink2, marginTop: 10, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {m.about}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: C.ink3, marginTop: 10, lineHeight: 1.4, fontStyle: 'italic' }}>
                        A community organization fostering Marathi culture in {m.city}.
                      </div>
                    )}
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: C.ink3, fontWeight: 600 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {m.members > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="people" size={14} color={C.ink3}/> {m.members.toLocaleString()}</span>}
                        {m.events > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="cal" size={14} color={C.ink3}/> {m.events} events</span>}
                        {m.members === 0 && m.events === 0 && <span style={{ color: C.blue }}>View details &rarr;</span>}
                      </div>
                      {m.dist && m.dist !== 'N/A' && <span style={{ color: C.saffronDk, fontWeight: 700 }}>{m.dist}</span>}
                    </div>
                  </div>
                </Card>
            </Link>
              );
            })}
          </div>
      </section>

      <AddMandalModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)}/>
      <FilterModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}
