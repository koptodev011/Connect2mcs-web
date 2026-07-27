'use client';

import { useState, useEffect } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, Avatar, SectionHead, PageHeader, Rating, useGlobalToast } from '@/components/primitives';
import { TiffinProvider } from '@/data/tiffin';
import { toneBg, toneColor } from '@/lib/tones';
import { BecomeProviderModal, FilterModal, ContactModal, InfoModal, TiffinSubscribeModal } from '@/components/FormModals';

const filters = ['All', 'Near me', 'Vegetarian', 'Non-veg', 'Jain', 'Weekly plan', 'Trial box'];

export default function TiffinPage() {
  const [tiffinData, setTiffinData] = useState<TiffinProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/tiffin')
      .then(res => res.json())
      .then(data => {
        setTiffinData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const [activeFilter, setActiveFilter] = useState('All');
  const [providerOpen, setProviderOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactTarget, setContactTarget] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Nearest');
  const [subTarget, setSubTarget] = useState<{ name: string; price: string } | null>(null);
  const toast = useGlobalToast();

  const filtered = tiffinData.filter(p => {
    if (activeFilter === 'All')         return true;
    if (activeFilter === 'Near me')     return p.city.includes('Boston') || p.city.includes('Edison');
    if (activeFilter === 'Vegetarian')  return p.veg;
    if (activeFilter === 'Non-veg')     return !p.veg;
    if (activeFilter === 'Jain')        return p.id === 'priya';
    if (activeFilter === 'Trial box')   return p.trial;
    if (activeFilter === 'Weekly plan') return true;
    return true;
  });

  const sortedProviders = [...filtered].sort((a, b) => {
    if (sortBy === 'Rating') return b.rating - a.rating;
    if (sortBy === 'Orders') return b.orders - a.orders;
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Tiffin Services"
        marathi="डबा"
        subtitle={`${loading ? '...' : tiffinData.length} home cooks · fresh daily · delivered across 6 cities worldwide`}
        actions={<>
          <Btn kind="ghost" size="md" iconL="filter" onClick={() => setFilterOpen(true)}>Filters</Btn>
          <Btn kind="dark"  size="md" iconL="plus" onClick={() => setProviderOpen(true)}>Become a provider</Btn>
        </>}
      />

      {/* Hero banner */}
      <div className="mob-stack" style={{
        background: 'linear-gradient(115deg, #5C1F12 0%, #A8321F 55%, #E26A1F 100%)',
        borderRadius: 20, padding: '30px 36px', color: '#fff', position: 'relative', overflow: 'hidden',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center',
      }}>
        <svg style={{ position: 'absolute', top: -30, right: -30, opacity: 0.1 }} width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
          <g fill="none" stroke="#fff" strokeWidth="1"><circle cx="110" cy="110" r="90"/><circle cx="110" cy="110" r="66"/><circle cx="110" cy="110" r="42"/></g>
        </svg>
        <div style={{ position: 'relative' }}>
          <Tag color="#FFD89C" bg="rgba(255,216,156,0.15)">🍱 Ghar ka khana · घरचं जेवण</Tag>
          <h2 style={{ margin: '12px 0 8px', fontFamily: F.display, fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Real Maharashtrian cooking.<br/>Delivered to your door.
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500, lineHeight: 1.55 }}>
            Community cooks making fresh, daily tiffin — the food you grew up on, wherever you are in the world.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn kind="primary" size="md" onClick={() => setActiveFilter('Near me')}>Find tiffin near me</Btn>
            <Btn kind="ghost" size="md" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => setActiveFilter('Trial box')}>Try a trial box</Btn>
          </div>
        </div>
        <div className="mob-stack" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['Fresh daily','Home-cooked every morning'],['No preservatives','Authentic recipes'],['Doorstep delivery','In your neighbourhood'],['Trial box','Try before subscribing']].map(([t, s], i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 14px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{t}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginTop: 3, lineHeight: 1.3 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {filters.map(f => <Pill key={f} active={activeFilter === f} onClick={() => setActiveFilter(f)}>{f}</Pill>)}
      </div>

      {/* Provider grid */}
      <section>
        <SectionHead
          title="Tiffin providers"
          subtitle={`${filtered.length} provider${filtered.length === 1 ? '' : 's'} · ${activeFilter}`}
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
              <option value="Nearest">Sort: Nearest</option>
              <option value="Rating">Sort: Rating</option>
              <option value="Orders">Sort: Orders</option>
            </select>
          }
        />
        {loading ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: C.ink3, fontSize: 13 }}>
            Loading tiffin providers...
          </div>
        ) : filtered.length === 0 ? (
          <Card pad={32} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink }}>No providers match this filter</div>
            <p style={{ margin: '8px 0 16px', fontSize: 13, color: C.ink3 }}>Try a different filter or become a provider.</p>
            <Btn kind="primary" size="md" iconL="plus" onClick={() => setProviderOpen(true)}>Become a provider</Btn>
          </Card>
        ) : (
          <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {sortedProviders.map((p, index) => {
              
              return (
                <Card key={`${p.id}-${index}`} interactive style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 54, height: 54, borderRadius: 12, background: toneBg[p.tone], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="tiffin" size={26} color={toneColor[p.tone]}/>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 2 }}>{p.city} · {p.mandal}</div>
                      <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Rating value={p.rating}/>
                        <span style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>{p.orders.toLocaleString()} orders</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <Tag color={p.veg ? C.green : C.brick} bg={p.veg ? C.greenLt : '#FAE0DA'}>
                        {p.veg ? '🟢 Veg' : '🔴 Non-veg'}
                      </Tag>
                      {p.trial && <Tag color={C.saffronDk} bg={C.saffronLt}>Trial ✓</Tag>}
                    </div>
                  </div>

                  {/* Specialty */}
                  <div style={{ background: toneBg[p.tone], borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: toneColor[p.tone], letterSpacing: '0.06em', textTransform: 'uppercase' }}>Specialty</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginTop: 2 }}>{p.specialty}</div>
                  </div>

                  {/* Menu highlights */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {p.menu.map(m => <Tag key={m} color={C.ink2} bg={C.bgDeep}>{m}</Tag>)}
                  </div>

                  {/* Delivery + days */}
                  <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginBottom: 6, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <Icon name="pin" size={13} color={C.ink3}/>
                    <span>{p.delivery}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginBottom: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Icon name="cal" size={13} color={C.ink3}/> {p.days} · Since {p.since}
                  </div>
                  <div style={{ fontSize: 12, color: C.ink3, fontStyle: 'italic', marginBottom: 14, lineHeight: 1.4 }}>"{p.note}"</div>

                  {/* Pricing + CTA */}
                  <div style={{ paddingTop: 12, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span className="num" style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.saffronDk, letterSpacing: '-0.02em' }}>{p.perMeal}</span>
                        <span style={{ fontSize: 12, color: C.ink3, fontWeight: 500 }}>/ meal</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, marginTop: 2 }}>{p.perMonth}/mo · {p.days}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn
                        kind="primary"
                        size="sm"
                        onClick={() => setSubTarget({ name: p.name, price: p.perMeal })}
                      >
                        Subscribe
                      </Btn>
                      <Btn kind="outline" size="sm" onClick={() => { setContactTarget(p.name); setContactOpen(true); }}><Icon name="chat" size={14}/></Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Become a provider */}
      <Card pad={28} className="mob-stack" style={{
        background: 'linear-gradient(135deg, #FFF8EB 0%, #FFE9D6 60%, #FFD9A6 100%)',
        border: `1px solid rgba(184,137,60,0.18)`,
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Cook for your community</div>
          <h3 style={{ margin: 0, fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            Turn your cooking into a community service.
          </h3>
          <p style={{ margin: '8px 0 0', fontSize: 13.5, color: C.ink2, fontWeight: 500, lineHeight: 1.5, maxWidth: 540 }}>
            Register as a tiffin provider. Set your own menu, prices and delivery area. The platform handles discovery — you handle the food.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn kind="dark" size="md" iconL="plus" onClick={() => setProviderOpen(true)}>Become a provider</Btn>
          <Btn kind="ghost" size="md" onClick={() => setInfoOpen(true)}>How it works</Btn>
        </div>
      </Card>
      <BecomeProviderModal isOpen={providerOpen} onClose={() => setProviderOpen(false)}/>
      <TiffinSubscribeModal isOpen={!!subTarget} onClose={() => setSubTarget(null)} providerName={subTarget?.name || ''} basePrice={subTarget?.price || ''}/>
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} title={`Message ${contactTarget}`} subtitle="Regarding tiffin services" />
      <InfoModal
        isOpen={infoOpen} onClose={() => setInfoOpen(false)}
        title="How it works"
        content={
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li><b>Find a cook:</b> Browse authenticated community cooks in your area.</li>
            <li><b>Try a trial box:</b> Many cooks offer a one-time trial box so you can taste the food.</li>
            <li><b>Subscribe:</b> Set up a weekly or monthly plan directly with the provider.</li>
            <li><b>Enjoy:</b> Get fresh, home-cooked Maharashtrian meals delivered.</li>
          </ul>
        }
      />
    </div>
  );
}
