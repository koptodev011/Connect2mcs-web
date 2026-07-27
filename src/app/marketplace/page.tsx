'use client';

import { useState } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import Link from 'next/link';
import { Btn, Card, Pill, Tag, Avatar, ImgPh, SectionHead, PageHeader } from '@/components/primitives';
import type { Condition, MarketplaceListing } from '@/data/marketplace';
import React, { useEffect } from 'react';
import { PostListingModal, ContactModal, InfoModal } from '@/components/FormModals';

const cats = ['All', 'Electronics', 'Furniture', 'Books', 'Vehicles', 'Kitchen', 'Clothing', 'Kids & Toys'];

const conditionStyle: Record<Condition, { bg: string; fg: string }> = {
  'New':      { bg: C.greenLt, fg: C.green   },
  'Like new': { bg: C.saffronLt, fg: C.saffronDk },
  'Good':     { bg: C.bgDeep,   fg: C.ink2   },
  'Used':     { bg: C.bgDeep,   fg: C.ink3   },
};

export default function MarketplacePage() {
  const [activeCat, setActiveCat] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [saved, setSaved]         = useState<Set<string>>(new Set());
  const [listings, setListings]   = useState<MarketplaceListing[]>([]);
  const [loading, setLoading]     = useState(true);
  const [postListingOpen, setPostListingOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactTarget, setContactTarget] = useState({ name: '', item: '' });
  const [cityFilter, setCityFilter] = useState('All cities');
  const [conditionFilter, setConditionFilter] = useState('Any condition');
  const [sortBy, setSortBy] = useState('Newest');
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    fetch('/api/data/marketplace')
      .then(res => res.json())
      .then(data => {
        setListings(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const filtered = listings.filter(l => {
    const matchCat = activeCat === 'All' || l.cat === activeCat;
    const matchQ = !searchQuery || 
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.seller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCity = cityFilter === 'All cities' || l.city === cityFilter;
    const matchCond = conditionFilter === 'Any condition' || l.condition === conditionFilter;
    return matchCat && matchQ && matchCity && matchCond;
  });
  
  const sortedListings = [...filtered].sort((a, b) => {
    if (sortBy === 'Price Low to High') {
      const priceA = parseInt(a.price.replace(/\D/g, '')) || 0;
      const priceB = parseInt(b.price.replace(/\D/g, '')) || 0;
      return priceA - priceB;
    }
    if (sortBy === 'Price High to Low') {
      const priceA = parseInt(a.price.replace(/\D/g, '')) || 0;
      const priceB = parseInt(b.price.replace(/\D/g, '')) || 0;
      return priceB - priceA;
    }
    return 0; // Newest
  });

  const toggleSave = (id: string) => setSaved(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Buy & Sell"
        marathi="बाजार"
        subtitle="Community marketplace · 340+ listings · vetted Mandal members only"
        actions={<>
          <Btn kind="ghost" size="md" iconL="search" onClick={() => document.querySelector<HTMLInputElement>('input[placeholder]')?.focus()}>Search listings</Btn>
          <Btn kind="dark"  size="md" iconL="plus" onClick={() => setPostListingOpen(true)}>Post a listing</Btn>
        </>}
      />

      {/* Trust banner */}
      <div className="mob-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { icon: 'verify' as const, title: 'Mandal-verified sellers', sub: 'Every seller is community-vouched', color: C.green,     bg: C.greenLt   },
          { icon: 'people' as const, title: '340+ active listings',    sub: 'New items added every day',        color: C.saffronDk, bg: C.saffronLt },
          { icon: 'chat'   as const, title: 'Direct contact',          sub: 'No platform fees · DM directly',   color: C.blue,      bg: '#DCE5F4'   },
          { icon: 'globe'  as const, title: '12 countries',            sub: 'US, UK, Canada, Australia & more', color: C.brick,     bg: '#FAE0DA'   },
        ].map((s, i) => (
          <Card key={i} pad={16} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={s.icon} size={20} color={s.color}/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>{s.title}</div>
              <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, marginTop: 2 }}>{s.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + filter */}
      <Card pad={14} className="mob-stack" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: C.bgDeep, borderRadius: 10 }}>
          <Icon name="search" size={16} color={C.ink3}/>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="MacBook, saree, sofa, kadhai…" 
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit' }}
          />
        </div>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.lineMid}`, borderRadius: 10, background: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          <option>All cities</option>
          {['Boston, MA','Edison, NJ','Toronto','London','Sydney','Pune, IN','Mumbai, IN'].map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.lineMid}`, borderRadius: 10, background: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          <option>Any condition</option>
          <option>New</option><option>Like new</option><option>Good</option><option>Used</option>
        </select>
        <Btn kind="primary" size="md">Search</Btn>
      </Card>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {cats.map(c => <Pill key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</Pill>)}
      </div>

      {/* Listings grid */}
      <section>
        <SectionHead
          title="Latest listings"
          subtitle={`${sortedListings.length} item${sortedListings.length === 1 ? '' : 's'} · ${activeCat}`}
          action={
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ appearance: 'none', background: 'transparent', border: 'none', color: C.saffronDk, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
              <option value="Newest">Sort: Newest</option>
              <option value="Price Low to High">Sort: Price (Low to High)</option>
              <option value="Price High to Low">Sort: Price (High to Low)</option>
            </select>
          }
        />
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.ink3 }}>Loading listings...</div>
        ) : filtered.length === 0 ? (
          <Card pad={32} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink }}>Nothing in this category yet</div>
            <p style={{ margin: '8px 0 16px', fontSize: 13, color: C.ink3 }}>Be the first to list something.</p>
            <Btn kind="primary" size="md" iconL="plus">Post a listing</Btn>
          </Card>
        ) : (
          <div className="mob-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {sortedListings.map((l) => {
              const isSaved = saved.has(l.id);
              const cs = conditionStyle[l.condition];
              return (
              <Link key={l.id} href={`/marketplace/${l.id}`} style={{ textDecoration: 'none', display: 'flex' }}>
                <Card pad={0} interactive style={{ overflow: 'hidden', position: 'relative', flex: 1 }}>
                  {l.featured && (
                    <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: C.saffron, color: '#fff', padding: '4px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>FEATURED</div>
                  )}
                  <ImgPh kind={l.kind} tone={l.tone} height={160}/>
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); toggleSave(l.id); }}
                    aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
                    style={{
                      position: 'absolute', top: 10, right: 10, zIndex: 2,
                      width: 32, height: 32, borderRadius: '50%',
                      background: isSaved ? C.brick : 'rgba(255,255,255,0.92)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(15,14,12,0.15)',
                    }}>
                    <Icon name="heart" size={15} color={isSaved ? '#fff' : C.ink2}/>
                  </button>
                  <div style={{ padding: '14px 15px 16px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: C.ink, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{l.title}</h4>
                    <div className="num" style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.saffronDk, letterSpacing: '-0.02em', marginBottom: 8 }}>{l.price}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                      <Tag color={cs.fg} bg={cs.bg}>{l.condition}</Tag>
                      <Tag color={C.ink2} bg={C.bgDeep}>{l.cat}</Tag>
                    </div>
                    <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                      <Icon name="pin" size={12} color={C.ink3}/> {l.city} · {l.when}
                    </div>
                    <div style={{ paddingTop: 10, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Avatar name={l.seller} size={24} style={{ fontSize: 9 }}/>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{l.seller}</div>
                          <div style={{ fontSize: 10, color: C.ink4, fontWeight: 500 }}>{l.mandal}</div>
                        </div>
                      </div>
                      <Btn kind="primary" size="sm" onClick={e => { e.preventDefault(); e.stopPropagation(); setContactTarget({ name: l.seller, item: l.title }); setContactOpen(true); }}>Contact</Btn>
                    </div>
                  </div>
                </Card>
              </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Post CTA */}
      <Card pad={28} className="mob-stack" style={{ background: 'linear-gradient(135deg, #FFF8EB 0%, #FFE9D6 100%)', border: `1px solid rgba(184,137,60,0.18)`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Sell within your community</div>
          <h3 style={{ margin: 0, fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            Post a listing in under 2 minutes.
          </h3>
          <p style={{ margin: '8px 0 0', fontSize: 13.5, color: C.ink2, fontWeight: 500, lineHeight: 1.5 }}>
            Free for all community members. No hidden fees — buyers contact you directly.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn kind="dark" size="md" iconL="plus" onClick={() => setPostListingOpen(true)}>Post a listing</Btn>
          <Btn kind="ghost" size="md" onClick={() => setInfoOpen(true)}>Selling tips</Btn>
        </div>
      </Card>
      <PostListingModal isOpen={postListingOpen} onClose={() => setPostListingOpen(false)}/>
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} title={`Contact ${contactTarget.name}`} subtitle={`Re: ${contactTarget.item}`}/>
      <InfoModal 
        isOpen={infoOpen} onClose={() => setInfoOpen(false)} 
        title="Selling Tips" 
        content={
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li><b>Be descriptive:</b> Include condition, age, and reason for selling.</li>
            <li><b>Price fairly:</b> Check similar listings to find a competitive price.</li>
            <li><b>Clean up:</b> Wipe down items before handing them over.</li>
            <li><b>Stay safe:</b> Meet in public places during daylight hours.</li>
          </ul>
        } 
      />
    </div>
  );
}
