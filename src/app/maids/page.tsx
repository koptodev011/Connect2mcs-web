'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { C, F } from '@/lib/tokens';
import { Card, SectionHead, Btn, Tag, Avatar, useGlobalToast } from '@/components/primitives';
import Icon from '@/components/Icon';
import { helpers } from '@/data/maids';
import { BookModal, FilterModal } from '@/components/FormModals';

export default function MaidsPage() {
  const [helpersData, setHelpersData] = useState(helpers);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [bookOpen, setBookOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedHelper, setSelectedHelper] = useState('');
  const toast = useGlobalToast();
  const topRated = [...helpersData]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  useEffect(() => {
    fetch('/api/data/maids')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load maid services');
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data)) setHelpersData(data);
      })
      .catch(error => console.error('Maid services API error:', error));
  }, []);

  const filterTypes: Record<string, (h: typeof helpers[0]) => boolean> = {
    All: () => true,
    'Verified Agency': h => h.verified,
    Community: h => !h.verified,
    'Live-in': h => h.services.toLowerCase().includes('live'),
  };

  const filtered = helpersData.filter(h => {
    const matchFilter = filterTypes[activeFilter]?.(h) ?? true;
    const matchSearch = !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.services.toLowerCase().includes(searchQuery.toLowerCase()) || h.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

      {/* Header & Search */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, color: C.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Maid Services
            </h1>
            <div style={{ fontSize: 14, color: C.ink2, fontWeight: 500 }}>
              Trusted help from the Marathi community
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 16, top: 14 }}><Icon name="search" size={20} color={C.ink3} /></div>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search maids, services, areas..." style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 12, border: `1px solid ${C.line}`, background: '#fff', fontSize: 15, fontFamily: F.ui, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <Btn kind="primary" style={{ padding: '0 24px', background: C.saffron, color: '#fff', border: 'none', borderRadius: 12 }} iconL="filter" onClick={() => setFilterOpen(true)}>Filter</Btn>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {['All', 'Verified Agency', 'Community', 'Live-in'].map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: '8px 16px', borderRadius: 20, background: activeFilter === f ? C.saffron : '#fff', color: activeFilter === f ? '#fff' : C.ink2, fontWeight: 600, fontSize: 13, border: activeFilter === f ? 'none' : `1px solid ${C.line}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Top Rated Horizontal Scroll */}
      <section>
        <SectionHead title="Top Rated" subtitle="Most trusted this month" />
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, margin: '0 -8px', padding: '0 8px' }}>
          {topRated.map(helper => (
            <Card key={`top-${helper.id}`} pad={20} style={{ minWidth: 280, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={helper.name} size={52} />
                 
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {helper.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, fontWeight: 700, color: C.ink }}>
                    <span style={{ color: C.saffron }}>★</span> {helper.rating}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span style={{ background: '#FFF1F0', color: C.brick, padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{helper.experience}</span>
                <span style={{ background: '#FFF8EB', color: C.saffronDk, padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{helper.jobs}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.ink3, marginBottom: 16 }}>
                <Icon name="pin" size={12} color={C.ink3} /> {helper.location}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.ink3, fontWeight: 600 }}>Starting</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.brick }}>{helper.price}</div>
                </div>
                <Link href={`/maids/${helper.id}`} style={{ textDecoration: 'none' }}>
                  <Btn kind="primary" size="sm" style={{ background: C.saffron, border: 'none', borderRadius: 20 }}>View</Btn>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Available Near You Grid */}
      <section>
        <SectionHead title="Available Near You" subtitle={`${helpersData.length} helpers available`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(helper => (
            <Card key={helper.id} pad={20}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar name={helper.name} size={48} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{helper.name}</div>
                      {helper.tag && <span style={{ background: '#FFF1F0', color: C.brick, padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>{helper.tag}</span>}
                    </div>
                  
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11, fontWeight: 600, color: C.ink2 }}>
                      <span style={{ color: C.saffron }}>★</span> {helper.rating} <span style={{ color: C.line }}>|</span> {helper.jobs}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.brick }}>{helper.price}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16, fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={14} color={C.ink3} /> {helper.location}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="globe" size={14} color={C.ink3} /> {helper.languages.join(', ')}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Btn kind="soft" size="sm" style={{ color: C.brick, background: '#FFF1F0', border: 'none' }} onClick={() => { setSelectedHelper(helper.name); setBookOpen(true); }}>Book →</Btn>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <BookModal
        isOpen={bookOpen}
        onClose={() => setBookOpen(false)}
        title={`Book ${selectedHelper}`}
        marathi="बुकिंग"
        submitLabel="Confirm booking"
        fields={[
          { key: 'phone', label: 'Phone number', placeholder: '+91 98765 43210', type: 'tel' },
          { key: 'start', label: 'Start date', type: 'date' },
          { key: 'notes', label: 'Special requirements', placeholder: 'Any notes...', multiline: true },
        ]}
      />
      <FilterModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}
