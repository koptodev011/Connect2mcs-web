'use client';

import { useState, useEffect } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Tag, ImgPh, SectionHead, PageHeader, useGlobalToast } from '@/components/primitives';
import Link from 'next/link';
import { festivalDays, todayDateLine } from '@/data/culture';
import type { Arti, MarathiMonth } from '@/data/culture';
import { newsStories } from '@/data/news';

type Tab = 'panchang' | 'arti' | 'news';

export default function CulturePage() {
  const [tab, setTab] = useState<Tab>('panchang');
  const toast = useGlobalToast();
  const [panchangData, setPanchangData] = useState<any>(null);
  const [artisData, setArtisData] = useState<Arti[]>([]);
  const [monthsData, setMonthsData] = useState<MarathiMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/data/culture').then(r => r.json()),
      fetch('/api/data/artis').then(r => r.json()),
      fetch('/api/data/calendar-months').then(r => r.json())
    ])
    .then(([panchang, artisRes, monthsRes]) => {
      if (Array.isArray(panchang) && panchang.length > 0) setPanchangData(panchang[0]);
      setArtisData(artisRes);
      setMonthsData(monthsRes);
      setLoading(false);
    })
    .catch(console.error);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Culture"
        marathi="संस्कृती"
        subtitle="Panchang, Artis, news, and the rhythm of Marathi life across the world"
        actions={<>
          <Link href="/culture#arti" style={{ textDecoration: 'none' }}>
            <Btn kind="ghost" size="md" iconL="lamp">Arti collection</Btn>
          </Link>
          <Link href="/news" style={{ textDecoration: 'none' }}>
            <Btn kind="ghost" size="md" iconL="news">All news</Btn>
          </Link>
        </>}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.line}`, padding: '0 4px' }}>
        {([
          { k: 'panchang' as Tab, label: 'Panchang', dev: 'पंचांग' },
          { k: 'arti'     as Tab, label: 'Arti',     dev: 'आरती' },
          { k: 'news'     as Tab, label: 'News',     dev: 'बातम्या' },
        ]).map(t => {
          const active = tab === t.k;
          return (
            <button key={t.k} onClick={() => setTab(t.k)} className={active ? undefined : 'nav-int'} style={{
              padding: '12px 18px', background: 'transparent', border: 'none',
              fontSize: 14, fontWeight: active ? 700 : 600,
              color: active ? C.saffronDk : C.ink2,
              borderBottom: `2px solid ${active ? C.saffron : 'transparent'}`,
              marginBottom: -1, cursor: 'pointer',
              fontFamily: F.ui, letterSpacing: '-0.005em',
              display: 'inline-flex', alignItems: 'baseline', gap: 8,
            }}>
              {t.label}
              <span style={{ fontFamily: F.deva, fontSize: 13, color: active ? C.saffronDk : C.ink3, fontWeight: 400 }}>{t.dev}</span>
            </button>
          );
        })}
      </div>

      {tab === 'panchang' && <PanchangTab data={panchangData} loading={loading} toast={toast} />}
      {tab === 'arti' && <ArtiTab artis={artisData} />}
      {tab === 'news' && <NewsTab/>}

      {/* Months ribbon (always visible) */}
      <section>
        <SectionHead title="Marathi months" subtitle="Tap a month to view its panchang" accent="महिने"/>
        <div className="mob-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {loading ? <div style={{ color: C.ink3 }}>Loading months...</div> : monthsData.map((m, i) => (
            <Card key={i} pad={0} interactive style={{ overflow: 'hidden', position: 'relative', cursor: 'pointer' }} onClick={() => setSelectedMonth(m)}>
              {m.current && (
                <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, background: C.saffron, color: '#fff', padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>NOW</div>
              )}
              {(m as any).image ? (
                <div style={{ height: 90, overflow: 'hidden' }}>
                  <img src={(m as any).image} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                </div>
              ) : (
                <ImgPh kind="panchang" tone={m.tone} height={90}/>
              )}
              <div style={{ padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: F.deva, fontSize: 22, fontWeight: 400, color: C.saffronDk }}>{m.dev}</div>
                <div style={{ fontFamily: F.display, fontSize: 13, fontWeight: 600, color: C.ink, marginTop: 2 }}>{m.name}</div>
                <div style={{ fontSize: 10.5, color: C.ink3, fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.days} days</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {selectedMonth && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedMonth(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.line}` }}>
              <div>
                <div style={{ fontFamily: F.deva, fontSize: 24, fontWeight: 400, color: C.saffronDk }}>{selectedMonth.dev}</div>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink }}>{selectedMonth.name} Panchang</div>
              </div>
              <button onClick={() => setSelectedMonth(null)} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: C.ink3 }}>&times;</button>
            </div>
            <div style={{ padding: 20, flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              {selectedMonth.image ? (
                <img src={selectedMonth.image} alt={selectedMonth.name} style={{ maxWidth: '100%', height: 'auto', display: 'block' }}/>
              ) : (
                <div style={{ color: C.ink3, padding: 40, textAlign: 'center' }}>No panchang image available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PanchangTab({ data, loading, toast }: { data: any, loading: boolean, toast: any }) {
  const [selectedDate, setSelectedDate] = useState<number>(7);
  const isSelectedFestival = festivalDays.includes(selectedDate);
  return (
    <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
      {/* Today */}
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(140deg, #FFF8EB 0%, #FFD9A6 100%)', padding: '24px 24px 22px', position: 'relative', overflow: 'hidden' }}>
          <svg style={{ position: 'absolute', top: -30, right: -30, opacity: 0.18 }} width="180" height="180" viewBox="0 0 180 180" aria-hidden="true">
            <g fill="none" stroke={C.saffronDk} strokeWidth="1">
              <circle cx="90" cy="90" r="74"/>
              <circle cx="90" cy="90" r="54"/>
              <circle cx="90" cy="90" r="34"/>
            </g>
          </svg>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.12em', textTransform: 'uppercase', position: 'relative' }}>Today · Boston, MA</div>
          <h2 style={{ margin: '6px 0 4px', fontFamily: F.display, fontSize: 30, fontWeight: 600, color: C.ink, letterSpacing: '-0.03em', position: 'relative' }}>
            <span style={{ fontFamily: F.deva, color: C.saffronDk, fontWeight: 400, marginRight: 10 }}>वैशाख</span>
            {loading ? '...' : data ? `${data.tithi} ${data.day}` : `Vaishakh ${selectedDate}`}
          </h2>
          <div style={{ fontSize: 14, color: C.ink2, fontWeight: 500, position: 'relative' }}>{loading ? '...' : data ? new Date(data.date).toLocaleDateString() : todayDateLine}</div>
        </div>
        <div style={{ padding: '8px 18px 18px' }}>
          {loading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: C.ink3, fontSize: 13 }}>Loading panchang...</div>
          ) : data ? (
            <>
              {[
                { key: 'Tithi', value: data.tithi },
                { key: 'Nakshatra', value: data.nakshatra },
                { key: 'Yoga', value: data.yoga },
                { key: 'Rashi', value: data.rashi },
                { key: 'Sunrise', value: data.sunrise },
                { key: 'Sunset', value: data.sunset },
              ].map((entry, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 5 ? `1px dashed ${C.line}` : 'none' }}>
                  <span style={{ color: C.ink3, fontWeight: 500, fontSize: 13 }}>{entry.key}</span>
                  <span style={{ color: C.ink, fontWeight: 700, fontSize: 13 }}>{entry.value}</span>
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center', color: C.ink3, fontSize: 13 }}>No panchang data</div>
          )}
        </div>
        <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.line}`, background: C.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>Source: Drik Panchang · Date Panchang</div>
          <Btn kind="ghost" size="sm" icon="arrow" onClick={() => window.open('https://www.drikpanchang.com/', '_blank')}>Open full panchang</Btn>
        </div>
      </Card>

      {/* Calendar grid */}
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>May 2026 · Vaishakh</div>
            <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 2 }}>Tap a date for tithi & festival info</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.lineMid}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevL" size={14}/></button>
            <button style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.lineMid}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevR" size={14}/></button>
          </div>
        </div>
        <div style={{ padding: '14px 14px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 8 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{ fontSize: 10.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.08em', padding: '6px 0' }}>{d.toUpperCase()}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 4;
              const valid = day >= 1 && day <= 31;
              const today = day === 7;
              const festival = festivalDays.includes(day);
              const isSelected = day === selectedDate;
              return (
                <div key={i} onClick={() => valid && setSelectedDate(day)} style={{
                  aspectRatio: '1', borderRadius: 10,
                  background: isSelected ? C.saffronLt : (today ? C.bgDeep : 'transparent'),
                  border: isSelected ? `1.5px solid ${C.saffron}` : `1px solid ${valid ? C.line : 'transparent'}`,
                  padding: 6, opacity: valid ? 1 : 0.25, cursor: valid ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                  {valid && (
                    <>
                      <div className="num" style={{ fontFamily: F.display, fontSize: 14, fontWeight: today || isSelected ? 700 : 600, color: isSelected ? C.saffronDk : C.ink, lineHeight: 1 }}>{day}</div>
                      <div style={{ fontFamily: F.deva, fontSize: 10, color: C.ink3, textAlign: 'right' }}>{['१','२','३','४','५','६','७','८','९','१०','११','१२','१३','१४','१५'][((day - 1) % 15)]}</div>
                      {festival && <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.brick, alignSelf: 'flex-start' }}/>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16, fontSize: 11.5, color: C.ink3, fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, background: C.brick, borderRadius: '50%' }}/> Festival</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, background: C.saffron, borderRadius: '50%' }}/> Today</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ArtiTab({ artis }: { artis: Arti[] }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const a = artis[active];

  // Reset state when switching artis
  useEffect(() => {
    setPlaying(false);
    setShowAll(false);
  }, [active]);

  if (!a) return <div style={{ padding: 20, color: C.ink3 }}>No artis found</div>;

  return (
    <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
      {/* List */}
      <Card pad={0}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>120+ Artis</div>
          <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 2 }}>Devotional hymns curated by community</div>
        </div>
        <div style={{ padding: '8px 0' }}>
          {artis.map((it, i) => (
            <div key={i} onClick={() => setActive(i)} style={{
              padding: '12px 18px', cursor: 'pointer',
              background: i === active ? C.surfaceAlt : 'transparent',
              borderLeft: `3px solid ${i === active ? C.saffron : 'transparent'}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: C.saffronLt, color: C.brick, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="lamp" size={18} color={C.brick}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</span>
                  {it.popular && <Tag color={C.saffronDk} bg={C.saffronLt}>Popular</Tag>}
                </div>
                <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, marginTop: 2 }}>{it.deity} · {it.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detail */}
      <Card pad={0} style={{ overflow: 'hidden' }}>
        {(a as any).image && (
          <div style={{ height: 200, overflow: 'hidden', borderBottom: `1px solid ${C.line}` }}>
            <img src={(a as any).image} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>
        )}
        <div style={{ background: 'linear-gradient(135deg, #FFF8EB 0%, #FFE0B5 100%)', padding: '28px 28px 22px', position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${C.line}` }}>
          <svg style={{ position: 'absolute', bottom: -40, right: -40, opacity: 0.16 }} width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
            <path d="M 110 30 q 70 22 70 90 q 0 70 -70 70 q -70 0 -70 -70 q 0 -36 36 -56" fill="none" stroke={C.saffronDk} strokeWidth="1.4"/>
            <path d="M 110 70 q 40 12 40 50 q 0 40 -40 40 q -40 0 -40 -40" fill="none" stroke={C.saffronDk} strokeWidth="1.2"/>
          </svg>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.12em', textTransform: 'uppercase', position: 'relative' }}>Arti · {a.deity}</div>
          <h2 style={{ margin: '6px 0 8px', fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: '-0.03em', position: 'relative' }}>{a.title}</h2>
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            <Btn kind={playing ? 'soft' : 'primary'} size="md" iconL={playing ? 'heart' : 'lamp'} onClick={() => setPlaying(!playing)}>
              {playing ? 'Playing...' : 'Play audio'}
            </Btn>
            <Btn kind={saved ? 'primary' : 'ghost'} size="md" style={{ background: saved ? C.saffron : '#fff' }} iconL="heart" onClick={() => setSaved(!saved)}>
              {saved ? 'Saved' : 'Save'}
            </Btn>
          </div>
        </div>
        <div style={{ padding: '24px 28px', fontFamily: F.deva, fontSize: 18, color: C.ink, lineHeight: 1.85, fontWeight: 400 }}>
          सुखकर्ता दुःखहर्ता वार्ता विघ्नांची ।<br/>
          नुरवी पुरवी प्रेम कृपा जयाची ।<br/>
          सर्वांगी सुंदर उटी शेंदुराची ।<br/>
          कंठी झळके माळ मुक्ताफळांची ।।१।।<br/><br/>
          <span style={{ color: C.ink3, fontStyle: 'italic' }}>जय देव जय देव जय मंगलमूर्ती ।<br/>
          दर्शनमात्रे मन कामना पुरती ।।धृ.।।</span>
          {showAll && (
            <>
              <br/><br/>
              रत्नखचित फरा तूज गौरीकुमरा ।<br/>
              चंदनाची उटी कुमकुम केशरा ।<br/>
              हिरे जडित मुकुट शोभतो बरा ।<br/>
              रुणझुणती नूपुरे चरणी घागरीया ।।२।।<br/><br/>
              लंबोदर पीतांबर फणिवर वंदना ।<br/>
              सरळ सोंड वक्रतुंड त्रिनयना ।<br/>
              दास रामाचा वाट पाहे सदना ।<br/>
              संकटी पावावे निर्वाणी रक्षावे सुरवरवंदना ।।३।।
            </>
          )}
        </div>
        <div style={{ padding: '14px 28px 22px', borderTop: `1px solid ${C.line}`, fontSize: 12.5, color: C.ink3, fontWeight: 500 }}>
          {showAll ? (
            <span style={{ color: C.saffronDk, fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowAll(false)}>Show less</span>
          ) : (
            <>Showing 1 of 4 verses · <span style={{ color: C.saffronDk, fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowAll(true)}>Show all</span></>
          )}
        </div>
      </Card>
    </div>
  );
}

function NewsTab() {
  const featured = newsStories.find(n => n.featured) ?? newsStories[0];
  const sideStories = newsStories.filter(n => !n.featured).slice(0, 4);

  return (
    <section>
      <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Featured */}
        <Link href="/news" style={{ textDecoration: 'none' }}>
          <Card pad={0} interactive style={{ overflow: 'hidden' }}>
            <ImgPh kind="news" tone={featured.tone} height={280}/>
          <div style={{ padding: '20px 24px 22px' }}>
            <Tag color={C.brick} bg="#FAE0DA">Featured · {featured.cat}</Tag>
            <h3 style={{ margin: '10px 0 8px', fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.25 }}>
              {featured.title}
            </h3>
            <div style={{ fontSize: 12.5, color: C.ink3, fontWeight: 500 }}>{featured.when} · 4 min read</div>
          </div>
        </Card>
        </Link>

        {/* Side stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sideStories.map((n, i) => (
            <Link key={i} href="/news" style={{ textDecoration: 'none' }}>
            <Card pad={14} interactive style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 80, height: 64, flexShrink: 0, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                <ImgPh kind="news" tone={n.tone} height={64}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Tag color={C.saffronDk} bg={C.saffronLt}>{n.cat}</Tag>
                <h4 style={{ margin: '4px 0 4px', fontFamily: F.display, fontSize: 14.5, fontWeight: 600, color: C.ink, letterSpacing: '-0.015em', lineHeight: 1.3 }}>{n.title}</h4>
                <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>{n.when}</div>
              </div>
            </Card>
            </Link>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <Link href="/news" style={{ textDecoration: 'none' }}>
          <Btn kind="ghost" size="md" icon="arrow">All news →</Btn>
        </Link>
      </div>
    </section>
  );
}
