'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Tag, Avatar, ImgPh, SectionHead, Rating } from '@/components/primitives';
import { OrnamentDivider } from '@/components/Ornament';
import Link from 'next/link';
import { homeEventKindMap, resources, heroStats } from '@/data/home';
import { communityPeople } from '@/data/community';
import { toneBg, toneColor } from '@/lib/tones';
import RoleDashboard from '@/components/role-dashboard/RoleDashboard';

import type { Mandal } from '@/data/mandals';
import type { CalendarEvent } from '@/data/events';
import type { Job } from '@/data/jobs';
import type { PanchangRow } from '@/data/culture';

// Editorial-cover hero. Warm paper background, large display headline, one
// primary CTA, and a single "happening now" spotlight on the right (instead
// of a dashboard-style 4-stat grid). Cultural ornament sits in the corners.
function HeroBanner() {
  const [firstName, setFirstName] = useState('Guest');

  useEffect(() => {
    function loadUser() {
      const saved = localStorage.getItem('mcs_user');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          setFirstName(user?.name ? user.name.split(' ')[0] : 'Guest');
        } catch {
          setFirstName('Guest');
        }
      } else {
        setFirstName('Guest');
      }
    }
    loadUser();
    window.addEventListener('mcs_auth_change', loadUser);
    return () => window.removeEventListener('mcs_auth_change', loadUser);
  }, []);

  return (
    <div className="mob-hero" style={{
      background: 'linear-gradient(135deg, #FFF8EB 0%, #FFEFD3 55%, #FFE0B5 100%)',
      borderRadius: 22,
      padding: '40px 44px',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(184, 137, 60, 0.18)',
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 36,
      alignItems: 'center',
      minHeight: 240,
    }}>
      {/* Ornamental paisley corners */}
      <svg style={{ position: 'absolute', top: -30, right: -30, opacity: 0.18 }}
           width="260" height="260" viewBox="0 0 260 260" aria-hidden="true">
        <g fill="none" stroke={C.saffronDk} strokeWidth="1">
          <circle cx="130" cy="130" r="110"/>
          <circle cx="130" cy="130" r="82"/>
          <circle cx="130" cy="130" r="54"/>
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i * 15 * Math.PI) / 180;
            // Round to 2 decimals so SSR + client serialize the exact same string
            // (avoids React hydration mismatch from float precision drift).
            const r = (n: number) => Math.round(n * 100) / 100;
            return <line key={i}
              x1={r(130 + Math.cos(a) * 54)}  y1={r(130 + Math.sin(a) * 54)}
              x2={r(130 + Math.cos(a) * 110)} y2={r(130 + Math.sin(a) * 110)}/>;
          })}
        </g>
      </svg>
      <svg style={{ position: 'absolute', bottom: -40, left: -40, opacity: 0.12 }}
           width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
        <path d="M 100 20 q 60 18 60 80 q 0 60 -60 60 q -60 0 -60 -60 q 0 -32 30 -50"
              fill="none" stroke={C.brick} strokeWidth="1.4"/>
        <path d="M 100 50 q 38 12 38 50 q 0 38 -38 38 q -38 0 -38 -38"
              fill="none" stroke={C.brick} strokeWidth="1.2"/>
        <circle cx="100" cy="100" r="6" fill={C.brick} opacity="0.6"/>
      </svg>

      {/* Left: editorial copy */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.brick,
          letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14,
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 18, height: 1, background: C.brick, opacity: 0.5 }}/>
          अक्षय तृतीया <span style={{ color: C.ink3, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>in 6 days</span>
        </div>
        <h1 className="mob-h1" style={{
          margin: 0,
          fontFamily: F.display,
          fontSize: 48, fontWeight: 600,
          letterSpacing: '-0.035em', lineHeight: 1.05,
          color: C.ink,
        }}>
          Namaskar, {firstName}.
        </h1>
        <p className="mob-sub" style={{
          margin: '16px 0 0', fontSize: 16, color: C.ink2,
          fontWeight: 400, maxWidth: 520, lineHeight: 1.5,
        }}>
          <strong style={{ color: C.ink, fontWeight: 600 }}>3 Mandals near Boston</strong> are hosting events this weekend, and your Pune Mandal group has <strong style={{ color: C.ink, fontWeight: 600 }}>12 new messages</strong>.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
          <Link href="/events" style={{ textDecoration: 'none' }}>
            <Btn kind="primary" size="lg" iconL="cal">See this weekend</Btn>
          </Link>
          <Link href="/mandals" style={{ textDecoration: 'none' }}>
            <Btn kind="subtle" size="lg" iconL="map">Find your Mandal</Btn>
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 24, fontSize: 12.5, color: C.ink3, fontWeight: 500, flexWrap: 'wrap' }}>
          <span><strong className="num" style={{ color: C.ink, fontWeight: 700 }}>{heroStats[0].v}</strong> {heroStats[0].l}</span>
          <span style={{ color: C.ink4 }}>·</span>
          <span><strong className="num" style={{ color: C.ink, fontWeight: 700 }}>{heroStats[1].v}</strong> {heroStats[1].l}</span>
          <span style={{ color: C.ink4 }}>·</span>
          <span><strong className="num" style={{ color: C.ink, fontWeight: 700 }}>{heroStats[2].v}</strong> {heroStats[2].l}</span>
        </div>
      </div>

      {/* Right: "Happening now" spotlight card */}
      <div className="mob-hide" style={{ position: 'relative', zIndex: 1 }}>
        <Card pad={0} style={{ overflow: 'hidden', boxShadow: '0 12px 32px rgba(110, 53, 32, 0.15), 0 2px 6px rgba(0,0,0,0.04)' }}>
          <ImgPh kind="event" tone="brick" height={132} badge="Happening Sat"/>
          <div style={{ padding: '16px 18px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.brick, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Featured event
            </div>
            <h3 style={{
              margin: '4px 0 6px', fontFamily: F.display,
              fontSize: 19, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.25,
            }}>
              Marathi Food Festival · NJ
            </h3>
            <div style={{ fontSize: 12.5, color: C.ink3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="clock" size={13} color={C.ink3}/> Sat 17 May · 11 am – 9 pm
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {['A', 'R', 'S', 'M'].map((n, j) => (
                  <Avatar key={j} name={n} size={22}
                    style={{ marginLeft: j ? -8 : 0, fontSize: 9, border: '2px solid #fff' }}/>
                ))}
                <span style={{ fontSize: 11.5, color: C.ink3, marginLeft: 8, fontWeight: 600 }}>412 going</span>
              </div>
              <Btn kind="primary" size="sm">RSVP</Btn>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MandalsRow() {
  const [data, setData] = useState<Mandal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/mandals')
      .then(res => res.json())
      .then(d => {
        setData(Array.isArray(d) ? d.slice(0, 5) : []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <section style={{ marginBottom: 36 }}>
      <SectionHead title="Mandals near you" subtitle="184 organisations across 27 countries" action="See all" actionHref="/mandals"/>
      <div className="scroll-row">
        {loading ? (
          <div style={{ padding: '20px', color: C.ink3, fontSize: 13 }}>Loading mandals...</div>
        ) : data.map((m, i) => (
          <Link key={`${m.code || i}`} href={`/mandals/${m.code}`} style={{ textDecoration: 'none', display: 'flex' }}>
            <Card pad={0} interactive style={{ overflow: 'hidden', flex: 1 }}>
              <ImgPh kind="mandal" label={m.code} showLabel height={130} tone={m.tone} badge={m.badge}/>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: C.ink3, marginTop: 2, fontWeight: 500 }}>{m.city}</div>
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
        ))}
      </div>
    </section>
  );
}

function EventsRow() {
  const [data, setData] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());

  const toggleRsvp = (id: string) => setRsvps(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  useEffect(() => {
    fetch('/api/data/events')
      .then(res => res.json())
      .then(d => {
        setData(Array.isArray(d) ? d.slice(0, 4) : []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <section style={{ marginBottom: 36 }}>
      <SectionHead title="Happening this week" subtitle="Events near Boston, MA" action="View calendar" actionHref="/events"/>
      <div className="scroll-row">
        {loading ? (
          <div style={{ padding: '20px', color: C.ink3, fontSize: 13 }}>Loading events...</div>
        ) : data.map((e, i) => (
          <Link key={`${e.id || i}`} href={`/events/${e.id}`} style={{ textDecoration: 'none', display: 'flex' }}>
            <Card pad={0} interactive style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative' }}>
                {e.image ? (
                  <img src={e.image} alt={e.title} style={{ height: 140, width: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImgPh kind={homeEventKindMap[e.cat] ?? 'event'} height={140} tone={e.tone}/>
                )}
                <div style={{ position: 'absolute', top: 12, left: 12, background: '#fff', borderRadius: 10, padding: '6px 10px', textAlign: 'center', minWidth: 50, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: 10, color: C.saffronDk, fontWeight: 700, letterSpacing: '0.08em' }}>{e.month}</div>
                  <div className="num" style={{ fontSize: 22, fontWeight: 700, color: C.ink, lineHeight: 1, marginTop: 1, fontFamily: F.display }}>{e.day}</div>
                </div>
              </div>
              <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{e.cat}</div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{e.title}</h4>
                {e.fullDate && <div style={{ fontSize: 11, color: C.ink3, marginTop: 4, fontWeight: 500 }}>{e.fullDate}</div>}
                {e.desc && <div style={{ fontSize: 12, color: C.ink2, marginTop: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.desc}</div>}
                <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: 12.5, color: C.ink3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="pin" size={13} color={C.ink3}/> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.where}</span>
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {[0,1,2].map(j => <Avatar key={j} name={['A','R','S'][j]} size={22} style={{ marginLeft: j ? -7 : 0, fontSize: 9, border: '2px solid #fff' }}/>)}
                    <span style={{ fontSize: 11.5, color: C.ink3, marginLeft: 7, fontWeight: 600 }}>+{e.going} going</span>
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
                      kind={rsvps.has(e.id || i.toString()) ? 'primary' : 'soft'}
                      size="sm"
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        toggleRsvp(e.id || i.toString());
                      }}
                    >
                      {rsvps.has(e.id || i.toString()) ? 'Going ✓' : 'RSVP'}
                    </Btn>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function JobsAndPanel() {
  const [jobsData, setJobsData] = useState<Job[]>([]);
  const [panchangData, setPanchangData] = useState<PanchangRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/data/jobs').then(res => res.json()),
      fetch('/api/data/culture').then(res => res.json())
    ]).then(([jData, pData]) => {
      setJobsData(Array.isArray(jData) ? jData : []);
      setPanchangData(Array.isArray(pData) ? pData : []);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const todayPanchang = panchangData[0] || { tithi: 'Loading...', day: '-', sunrise: '-', sunset: '-', nakshatra: '-', yoga: '-', rashi: '-', date: '-' };
  const homePanchangRows = [
    ['Sunrise', todayPanchang.sunrise + ' Sunset', todayPanchang.sunset],
    ['Nakshatra', todayPanchang.nakshatra],
  ];

  return (
    <section className="mob-stack" style={{ marginBottom: 36, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22 }}>
      <div>
        <SectionHead title="Hot jobs for you" subtitle="Matched by skills + your Mandal network" action="All 1,248 jobs" actionHref="/jobs"/>
        <Card pad={0}>
          {loading ? (
            <div style={{ padding: '20px', color: C.ink3, fontSize: 13 }}>Loading jobs...</div>
          ) : jobsData.slice(0, 5).map((j, i) => (
            <Link key={`${j.id || i}`} href="/jobs" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 14, padding: '14px 18px', alignItems: 'center', borderBottom: i < 4 ? `1px solid ${C.line}` : 'none', cursor: 'pointer' }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: toneBg[j.tone], color: toneColor[j.tone], fontSize: 20, fontWeight: 700, fontFamily: F.display, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{j.logo}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{j.role}</span>
                    {(j.tag === 'New' || j.tag === 'Hot') && <Tag color="#fff" bg={C.brick}>New</Tag>}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.ink3, marginTop: 2, fontWeight: 500 }}>{j.co} <span style={{ color: C.ink4 }}>·</span> {j.loc}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                    <Tag color={C.ink2} bg={C.bgDeep}>{j.pay}</Tag>
                    <Tag color={C.ink2} bg={C.bgDeep}>{j.exp}</Tag>
                  </div>
                </div>
                <Btn kind="outline" size="sm">Apply</Btn>
              </div>
            </Link>
          ))}
        </Card>
      </div>
      <div>
        <SectionHead title="Career simulator" subtitle="12 questions, ~6 minutes" action="Start"/>
        <div style={{ background: 'linear-gradient(140deg, #FFE9D6 0%, #FFD09C 100%)', borderRadius: 16, padding: 24, border: `1px solid ${C.line}`, position: 'relative', overflow: 'hidden' }}>
          {/* corner paisley */}
          <svg style={{ position: 'absolute', top: -20, right: -20, opacity: 0.18 }} width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
            <g fill="none" stroke={C.saffronDk} strokeWidth="1">
              <circle cx="70" cy="70" r="56"/>
              <circle cx="70" cy="70" r="40"/>
              <circle cx="70" cy="70" r="24"/>
            </g>
          </svg>
          <Tag color={C.saffronDk} bg="rgba(255,255,255,0.7)">✨ 12 Qs · ~6 min</Tag>
          <h3 style={{ margin: '12px 0 8px', fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.2, position: 'relative' }}>Find your career path<br/>in 6 minutes.</h3>
          <p style={{ margin: 0, fontSize: 13.5, color: C.ink2, fontWeight: 500, lineHeight: 1.55, position: 'relative' }}>Answer 12 quick questions about your skills, education and goals — get a personalised roadmap.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Link href="/career-simulator" style={{ textDecoration: 'none' }}>
              <Btn kind="dark" size="md" iconL="spark">Start the quiz</Btn>
            </Link>
            <Link href="/career-simulator" style={{ textDecoration: 'none' }}>
              <Btn kind="ghost" size="md" style={{ background: '#fff' }}>Learn more</Btn>
            </Link>
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 14, fontSize: 11.5, color: C.ink2, fontWeight: 600, position: 'relative', flexWrap: 'wrap' }}>
            <span>✓ Skill match</span><span>✓ Salary range</span><span>✓ Mentor referrals</span>
          </div>
        </div>
        <Card style={{ marginTop: 14 }} pad={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Today <span style={{ color: C.ink4 }}>·</span> <span style={{ fontFamily: F.deva, fontSize: 14, letterSpacing: 0, textTransform: 'none' }}>पंचांग</span></div>
              <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 600, color: C.ink, marginTop: 4, letterSpacing: '-0.02em' }}>{todayPanchang.tithi}</div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: C.saffronLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.deva, fontSize: 26, color: C.brick }}>{todayPanchang.day}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
            {homePanchangRows.map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? `1px dashed ${C.line}` : 'none' }}>
                <span style={{ color: C.ink3, fontWeight: 500 }}>{k}</span>
                <span style={{ color: C.ink, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

function CommunityRow() {
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const toggleConnect = (name: string) => setConnected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });

  return (
    <section style={{ marginBottom: 36 }}>
      <SectionHead title="Community around you" subtitle="Professionals and leaders near Boston" action="Network" actionHref="/network"/>
      <div className="scroll-row-sm">
        {communityPeople.slice(0, 5).map((p, i) => (
          <Link key={i} href={`/profile/${encodeURIComponent(p.name)}`} style={{ textDecoration: 'none' }}>
            <Card style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}>
              <Avatar name={p.name} size={64} style={{ margin: '4px auto 12px', fontSize: 24 }}/>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ fontSize: 12, color: C.ink3, marginTop: 2, fontWeight: 500, lineHeight: 1.3, height: 32, overflow: 'hidden' }}>{p.role}</div>
              <div style={{ fontSize: 10.5, color: C.ink4, marginTop: 6, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{p.mandal}</div>
              <div style={{ marginTop: 12 }}>
                <Btn
                  kind={connected.has(p.name) ? 'soft' : 'outline'}
                  size="sm"
                  full
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleConnect(p.name);
                  }}
                >
                  {connected.has(p.name) ? 'Pending' : '+ Connect'}
                </Btn>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ResourceTiles() {
  return (
    <section style={{ marginBottom: 12 }}>
      <SectionHead title="Everything on Connect2MCS" subtitle="Tools and resources for every member of the community"/>
      <div className="scroll-row">
        {resources.map((it) => (
          <Link key={it.title} href={it.href} style={{ textDecoration: 'none' }}>
            <Card pad={0} interactive style={{ overflow: 'hidden' }}>
              <ImgPh kind={it.kind} tone={it.tone} height={120}/>
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>{it.title}</div>
                <div style={{ fontSize: 12.5, color: C.ink3, marginTop: 3, fontWeight: 500 }}>{it.sub}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

type HomeKind = 'loading' | 'student' | 'entrepreneur' | 'default';

function getHomeKind(): HomeKind {
  let user: { loginType?: string; isGuest?: boolean } | null = null;
  try {
    const savedUser = localStorage.getItem('mcs_user');
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch {
    user = null;
  }

  if (!user || user.isGuest) return 'default';
  const loginType = String(localStorage.getItem('MCS_LoginType') || user.loginType || '')
    .trim()
    .toUpperCase();
  return loginType === 'S' ? 'student' : loginType === 'E' ? 'entrepreneur' : 'default';
}

function subscribeHomeKind(onStoreChange: () => void) {
  window.addEventListener('mcs_auth_change', onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener('mcs_auth_change', onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

export default function HomePage() {
  const homeKind = useSyncExternalStore(subscribeHomeKind, getHomeKind, () => 'loading');

  if (homeKind === 'loading') return <div style={{ minHeight: 480 }} aria-label="Loading dashboard" />;
  if (homeKind === 'student') return <RoleDashboard kind="student" />;
  if (homeKind === 'entrepreneur') return <RoleDashboard kind="entrepreneur" />;

  return (
    <div className="home-stack">
      <HeroBanner/>
      <MandalsRow/>
      <EventsRow/>
      <JobsAndPanel/>
      <OrnamentDivider label="For the community" marathi="समुदायासाठी"/>
      <CommunityRow/>
      <ResourceTiles/>
    </div>
  );
}
