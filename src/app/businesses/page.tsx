'use client';

import { useState, useEffect } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import Link from 'next/link';
import { Btn, Card, Pill, Tag, Avatar, SectionHead, PageHeader, Rating, useGlobalToast } from '@/components/primitives';
import { FilterModal } from '@/components/FormModals';
import { businessStats, Business } from '@/data/businesses';
import { toneBg, toneColor } from '@/lib/tones';
import { ListBusinessModal } from '@/components/FormModals';

const cats = ['All', 'Legal', 'Medical', 'Real Estate', 'Finance', 'IT & Tech', 'Restaurant', 'Education', 'Travel'];

export default function BusinessesPage() {
  const [businessesData, setBusinessesData] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const toast = useGlobalToast();
  
  useEffect(() => {
    fetch('/api/data/businesses')
      .then(res => res.json())
      .then(data => {
        setBusinessesData(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const [activeCat, setActiveCat] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Rating');
  const [contacted, setContacted] = useState<Set<string>>(new Set());
  const [listBizOpen, setListBizOpen] = useState(false);
  const toggle = (id: string) => setContacted(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = businessesData.filter(b => {
    const matchCat = activeCat === 'All' || b.cat === activeCat;
    const matchQ = !searchQuery || 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQ;
  });
  
  const sortedBusinesses = [...filtered].sort((a, b) => {
    if (sortBy === 'Rating') {
      return b.rating - a.rating;
    }
    if (sortBy === 'Reviews') {
      return b.reviews - a.reviews;
    }
    return 0; // default
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Business Services"
        marathi="व्यवसाय"
        subtitle={`${loading ? '...' : businessesData.length} Marathi-owned businesses across the globe`}
        actions={<>
          <Btn kind="ghost" size="md" iconL="filter" onClick={() => setFilterOpen(true)}>Filters</Btn>
          <Btn kind="dark"  size="md" iconL="plus" onClick={() => setListBizOpen(true)}>List your business</Btn>
        </>}
      />

      {/* Stats */}
      <div className="mob-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {businessStats.map((s, i) => (
          <Card key={i} pad={20}>
            <div className="num" style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: C.ink }}>{s.v}</div>
            <div style={{ fontSize: 12.5, color: C.ink3, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</div>
            <div style={{ fontSize: 11, color: C.ink4, fontWeight: 500, marginTop: 2 }}>{s.s}</div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card pad={14} className="mob-stack" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: C.bgDeep, borderRadius: 10 }}>
          <Icon name="search" size={16} color={C.ink3}/>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lawyer, cardiologist, caterer, Marathi school…" 
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit' }}
          />
        </div>
        <select style={{ padding: '9px 12px', border: `1px solid ${C.lineMid}`, borderRadius: 10, background: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          <option>All cities</option>
          {['Boston, MA','Edison, NJ','Toronto','London, UK','Bengaluru','Sydney'].map(c => <option key={c}>{c}</option>)}
        </select>
        <Btn kind="primary" size="md">Search</Btn>
      </Card>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {cats.map(c => <Pill key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</Pill>)}
      </div>

      {/* Businesses grid */}
      <section>
        <SectionHead
          title="Directory"
          subtitle={`${sortedBusinesses.length} business${sortedBusinesses.length === 1 ? '' : 'es'} · ${activeCat}`}
          action={
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ appearance: 'none', background: 'transparent', border: 'none', color: C.saffronDk, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
              <option value="Rating">Sort: Rating</option>
              <option value="Reviews">Sort: Reviews</option>
            </select>
          }
        />
        {loading ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: C.ink3, fontSize: 13 }}>
            Loading businesses from iDempiere...
          </div>
        ) : filtered.length === 0 ? (
          <Card pad={32} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink }}>No businesses in this category yet</div>
            <p style={{ margin: '8px 0 16px', fontSize: 13, color: C.ink3 }}>Be the first to list yours.</p>
            <Btn kind="primary" size="md" iconL="plus" onClick={() => setListBizOpen(true)}>List your business</Btn>
          </Card>
        ) : (
          <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {sortedBusinesses.map((b) => {
              const isContacted = contacted.has(b.id);
              return (
              <Link key={b.id} href={`/businesses/${b.id}`} style={{ textDecoration: 'none', display: 'flex' }}>
                <Card interactive style={{ flex: 1 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                      background: toneBg[b.tone], color: toneColor[b.tone],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, fontWeight: 700, fontFamily: F.display,
                    }}>
                      {b.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>{b.name}</span>
                        {b.verified && <Icon name="verify" size={16} color={C.green}/>}
                      </div>
                      <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 2 }}>{b.owner}</div>
                      <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Rating value={b.rating} count={b.reviews}/>
                        <span style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>{b.years}y exp</span>
                        {b.phone && <span style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>· {b.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <Tag color={toneColor[b.tone]} bg={toneBg[b.tone]}>{b.cat}</Tag>
                    <Tag color={C.ink2} bg={C.bgDeep}><Icon name="pin" size={11} color={C.ink3}/> {b.city}</Tag>
                    {b.mandal && b.mandal !== '-' && <Tag color={C.ink2} bg={C.bgDeep}><Icon name="star" size={11} color={C.ink3}/> {b.mandal}</Tag>}
                  </div>

                  {/* Description */}
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: C.ink2, fontWeight: 500, lineHeight: 1.55 }}>{b.desc}</p>

                  {/* Services */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                    {b.services.map(s => <Tag key={s} color={C.ink2} bg={C.bgDeep}>{s}</Tag>)}
                  </div>

                  {/* Footer */}
                  <div style={{ paddingTop: 12, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11.5, color: C.ink4, fontWeight: 500 }}>{b.mandal}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn
                        kind="primary"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `mailto:contact@${b.name.replace(/\s+/g, '').toLowerCase()}.com?subject=Inquiry from Connect2MCS`;
                        }}
                      >
                        Contact
                      </Btn>
                      <Btn kind="outline" size="sm" onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(window.location.origin + `/businesses/${b.id}`);
                        toast.add('Link copied to clipboard!', 'success');
                      }}><Icon name="share" size={14}/></Btn>
                    </div>
                  </div>
                </Card>
              </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* List CTA */}
      <Card pad={28} className="mob-stack" style={{ background: 'linear-gradient(135deg, #FFF8EB 0%, #FFE9D6 100%)', border: `1px solid rgba(184,137,60,0.18)`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Grow your business</div>
          <h3 style={{ margin: 0, fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            List your business — free for community members.
          </h3>
          <p style={{ margin: '8px 0 0', fontSize: 13.5, color: C.ink2, fontWeight: 500, lineHeight: 1.5 }}>
            Reach 38,000 Marathi community members across 27 countries. Mandal-verified listings only.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn kind="dark" size="md" iconL="plus" onClick={() => setListBizOpen(true)}>List your business</Btn>
          <Btn kind="ghost" size="md" onClick={() => window.location.href = "mailto:advertise@connect2mcs.com"}>Advertise</Btn>
        </div>
      </Card>
      <ListBusinessModal isOpen={listBizOpen} onClose={() => setListBizOpen(false)}/>
      <FilterModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}
