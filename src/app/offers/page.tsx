'use client';

import { useState, useEffect } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, ImgPh, SectionHead, PageHeader, Modal, useGlobalToast } from '@/components/primitives';
import { featuredOffer, Offer } from '@/data/offers';
import { NotifyMeModal } from '@/components/FormModals';

const cats = ['All', 'Food & Dining', 'Travel', 'Finance', 'Grocery', 'Health', 'Legal', 'Tech'];

export default function OffersPage() {
  const [offersData, setOffersData] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useGlobalToast();

  useEffect(() => {
    fetch('/api/data/offers')
      .then(res => res.json())
      .then(data => {
        setOffersData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const [activeCat, setActiveCat] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [claimedOffers, setClaimedOffers] = useState<Set<string>>(new Set());
  const [notifyOpen, setNotifyOpen] = useState(false);

  const filtered = activeCat === 'All' ? offersData : offersData.filter(o => o.cat === activeCat);
  const sortedOffers = [...filtered].sort((a, b) => {
    if (sortBy === 'Popular') return b.claimed - a.claimed;
    return 0; // Newest
  });

  const handleClaim = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    toast.add(`Promo code ${code} copied to clipboard!`, 'success');
    setClaimedOffers(s => { const n = new Set(s); n.add(id); return n; });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="MCS Offers"
        marathi="सवलती"
        subtitle={`${loading ? '...' : offersData.length} exclusive deals for Connect2MCS members · updated monthly`}
        actions={<>
          <Btn kind="ghost" size="md" iconL="bell" onClick={() => setNotifyOpen(true)}>Notify me of new offers</Btn>
          <Btn kind="dark" size="md" iconL="plus" onClick={() => { window.location.href = 'mailto:partners@connect2mcs.com'; }}>Partner with us</Btn>
        </>}
      />

      {/* Featured offer */}
      <div className="mob-stack" style={{
        background: 'linear-gradient(115deg, #1F4DA8 0%, #2A68C8 50%, #E26A1F 100%)',
        borderRadius: 20, overflow: 'hidden',
        display: 'grid', gridTemplateColumns: '1.2fr 1fr', minHeight: 240,
      }}>
        <div style={{ padding: '36px 40px', position: 'relative', zIndex: 1 }}>
          <svg style={{ position: 'absolute', top: -20, left: -20, opacity: 0.12 }} width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
            <g fill="none" stroke="#fff" strokeWidth="1"><circle cx="100" cy="100" r="80"/><circle cx="100" cy="100" r="56"/><circle cx="100" cy="100" r="32"/></g>
          </svg>
          <Tag color="#FFD89C" bg="rgba(255,216,156,0.18)">⭐ Featured offer · {featuredOffer.cat}</Tag>
          <h2 style={{ margin: '14px 0 10px', color: '#fff', fontFamily: F.display, fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {featuredOffer.title}
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500, lineHeight: 1.55, maxWidth: 480 }}>
            {featuredOffer.desc}
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px dashed rgba(255,255,255,0.4)', borderRadius: 10, padding: '10px 18px' }}>
              <div style={{ fontSize: 10, color: '#FFD89C', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Promo code</div>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.04em', marginTop: 2 }}>{featuredOffer.code}</div>
            </div>
            <div>
              <Btn kind={claimedOffers.has(featuredOffer.id) ? 'soft' : 'primary'} size="lg" onClick={() => handleClaim(featuredOffer.id, featuredOffer.code)}>
                {claimedOffers.has(featuredOffer.id) ? 'Code Copied ✓' : 'Claim this offer'}
              </Btn>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginTop: 6, fontWeight: 500 }}>Expires {featuredOffer.expires} · {featuredOffer.savings}</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px 28px', background: 'rgba(0,0,0,0.15)' }}>
          {[['38K+','Members saving'],['₹850','Avg. monthly savings'],['99%','Verified partners']].map(([n, l], i) => (
            <div key={i} style={{ textAlign: 'center', padding: '12px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.12)' : 'none', width: '100%' }}>
              <div className="num" style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: '#fff' }}>{n}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {cats.map(c => <Pill key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</Pill>)}
      </div>

      {/* Offer grid */}
      <section>
        <SectionHead
          title="All offers"
          subtitle={`${sortedOffers.length} deal${sortedOffers.length === 1 ? '' : 's'} · ${activeCat}`}
          action={
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ appearance: 'none', background: 'transparent', border: 'none', color: C.saffronDk, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
              <option value="Newest">Sort: Newest</option>
              <option value="Popular">Sort: Popular</option>
            </select>
          }
        />
        {loading ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: C.ink3, fontSize: 13 }}>
            Loading offers from iDempiere...
          </div>
        ) : filtered.length === 0 ? (
          <Card pad={32} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink }}>No offers in this category yet</div>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: C.ink3 }}>Check back soon — new offers added monthly.</p>
          </Card>
        ) : (
          <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {sortedOffers.map((o, index) => {
              return (
                <Card key={`${o.id}-${index}`} pad={0} interactive style={{ overflow: 'hidden', position: 'relative' }}>
                  {o.new && (
                    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, background: C.brick, color: '#fff', padding: '4px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>NEW</div>
                  )}
                  <ImgPh kind={o.kind} tone={o.tone} height={130}/>
                  <div style={{ padding: '16px 18px 18px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                      {o.partner} · {o.cat}
                    </div>
                    <h4 style={{ margin: '0 0 6px', fontFamily: F.display, fontSize: 17, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.3 }}>{o.title}</h4>
                    <p style={{ margin: '0 0 12px', fontSize: 12.5, color: C.ink3, fontWeight: 500, lineHeight: 1.5 }}>{o.desc}</p>

                    {/* Code block */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.bgDeep, border: `1.5px dashed ${C.lineMid}`, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: C.ink3, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Promo code</div>
                        <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: '0.04em', marginTop: 2 }}>{o.code}</div>
                      </div>
                      <Tag color={C.saffronDk} bg={C.saffronLt}>{o.savings}</Tag>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>
                          <Icon name="clock" size={12} color={C.ink3}/> Expires {o.expires}
                        </div>
                        <div style={{ fontSize: 11, color: C.ink4, fontWeight: 500, marginTop: 2 }}>{o.claimed.toLocaleString()} members claimed</div>
                      </div>
                      <Btn
                        kind={claimedOffers.has(o.id) ? 'soft' : 'primary'}
                        size="sm"
                        onClick={() => handleClaim(o.id, o.code)}
                      >
                        {claimedOffers.has(o.id) ? 'Code Copied ✓' : 'Claim'}
                      </Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Partner CTA */}
      <Card pad={28} style={{ textAlign: 'center', background: 'linear-gradient(135deg, #FFF8EB 0%, #FFE9D6 100%)', border: `1px solid rgba(184,137,60,0.18)` }}>
        <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: '-0.025em', marginBottom: 8 }}>
          Reach 38,000 Marathi households worldwide
        </div>
        <p style={{ margin: '0 0 18px', fontSize: 14, color: C.ink2, fontWeight: 500, lineHeight: 1.55, maxWidth: 560, marginInline: 'auto' }}>
          Partner with Connect2MCS to offer exclusive deals to our highly engaged NRI community. Vetted brands only.
        </p>
        <Btn kind="dark" size="md" iconL="plus" onClick={() => { window.location.href = 'mailto:partners@connect2mcs.com'; }}>Apply to become a partner</Btn>
      </Card>

      <NotifyMeModal isOpen={notifyOpen} onClose={() => setNotifyOpen(false)}/>
    </div>
  );
}
