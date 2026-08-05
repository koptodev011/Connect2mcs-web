'use client';

import { useState, useEffect } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import Link from 'next/link';
import { Btn, Card, Pill, Tag, Avatar, ImgPh, SectionHead, PageHeader, useGlobalToast } from '@/components/primitives';
import { PostHousingModal, BookModal, ContactModal, InfoModal, FilterModal } from '@/components/FormModals';
import type { HousingListing, HousingRequest } from '@/data/housing';

const filters = ['All', 'Near me', 'Roommate', 'Whole place', 'Short stay', 'Student-friendly'];

export default function HousingPage() {
  const [housingData, setHousingData] = useState<HousingListing[]>([]);
  const [requestsData, setRequestsData] = useState<HousingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [postListingOpen, setPostListingOpen] = useState(false);
  const [postReqOpen, setPostReqOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactTarget, setContactTarget] = useState({ name: '', role: '' });
  const toast = useGlobalToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/data/housing').then(res => res.json()),
      fetch('/api/data/housing-requests').then(res => res.json())
    ])
    .then(([housing, reqs]) => {
      setHousingData(Array.isArray(housing) ? housing : []);
      setLoading(false);
      setRequestsData(Array.isArray(reqs) ? reqs : []);
      setLoadingRequests(false);
    })
    .catch(console.error);
  }, []);

  const [active, setActive] = useState('All');
  const [saved, setSaved]   = useState<Set<string>>(new Set());
  const [reqSaved, setReqSaved] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState('Newest');

  const toggleSave = (id: string) => setSaved(s => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const toggleReqSave = (id: number) => setReqSaved(s => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const filtered = housingData.filter(l => {
    if (active === 'All')                   return true;
    if (active === 'Near me')               return l.nearMe;
    if (active === 'Roommate')              return l.type === 'Roommate';
    if (active === 'Whole place')           return l.type === 'Whole place';
    if (active === 'Short stay')            return l.stay === 'Short stay';
    if (active === 'Student-friendly')      return l.student;
    return true;
  });

  const sortedListings = [...filtered].sort((a, b) => {
    if (sortBy === 'Price Low to High') {
      const priceA = parseInt(a.rent.replace(/\D/g, '')) || 0;
      const priceB = parseInt(b.rent.replace(/\D/g, '')) || 0;
      return priceA - priceB;
    }
    if (sortBy === 'Price High to Low') {
      const priceA = parseInt(a.rent.replace(/\D/g, '')) || 0;
      const priceB = parseInt(b.rent.replace(/\D/g, '')) || 0;
      return priceB - priceA;
    }
    return 0; // Newest
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Shared Accommodation"
        marathi="निवारा"
        subtitle={`${loading ? '...' : housingData.length} listings worldwide · vetted by community members · post yours in under 2 minutes`}
        actions={<>
          <Btn kind="ghost" size="md" iconL="filter" onClick={() => setFilterOpen(true)}>Filters</Btn>
          <Btn kind="dark" size="md" iconL="plus" onClick={() => setPostListingOpen(true)}>Post a listing</Btn>
        </>}
      />

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {filters.map(f => <Pill key={f} active={active === f} onClick={() => setActive(f)}>{f}</Pill>)}
      </div>

      {/* Quick post strip */}
      <Card pad={0} className="mob-stack" style={{ overflow: 'hidden', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 0 }}>
        <div style={{ padding: '24px 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Need a place?</div>
          <h3 style={{ margin: '8px 0 8px', fontFamily: F.display, fontSize: 24, fontWeight: 600, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            Tell the community what you're looking for.
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 13.5, color: C.ink2, fontWeight: 500, lineHeight: 1.5, maxWidth: 480 }}>
            Post your requirement — city, budget, dates, who you are. Members with matching listings will reach out directly.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="primary" size="md" iconL="plus" onClick={() => setPostReqOpen(true)}>Post requirement</Btn>
            <Btn kind="ghost" size="md" onClick={() => setInfoOpen(true)}>How it works</Btn>
          </div>
        </div>
        <ImgPh kind="housing" tone="saffron" height="auto" style={{ minHeight: 180 }}/>
      </Card>

      {/* Listings */}
      <section>
        <SectionHead
          title="Available right now"
          subtitle={`Showing ${filtered.length} of ${loading ? '...' : housingData.length} listings · ${active}`}
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
              <option value="Newest">Sort: Newest</option>
              <option value="Price Low to High">Sort: Price (Low to High)</option>
              <option value="Price High to Low">Sort: Price (High to Low)</option>
            </select>
          }
        />
        {loading ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: C.ink3, fontSize: 13 }}>
            Loading housing listings from iDempiere...
          </div>
        ) : filtered.length === 0 ? (
          <Card pad={32} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink }}>Nothing matches that filter</div>
            <p style={{ margin: '8px 0 16px', fontSize: 13, color: C.ink3, fontWeight: 500 }}>Try a different filter, or post your requirement.</p>
            <Btn kind="primary" size="md" iconL="plus" onClick={() => setPostReqOpen(true)}>Post requirement</Btn>
          </Card>
        ) : (
          <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {sortedListings.map((l, index) => {
              const isSaved = saved.has(l.id);
              return (
              <div key={`${l.id}-${index}`} style={{ textDecoration: 'none', display: 'flex' }}>
                <Card pad={0} interactive style={{ overflow: 'hidden', position: 'relative', flex: 1 }}>
                  <Link href={`/housing/${l.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {(l as any).image ? (
                      <div style={{ height: 150, overflow: 'hidden', position: 'relative' }}>
                        <img src={(l as any).image} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        {l.stay && (
                          <div style={{ position: 'absolute', top: 10, left: 10, background: '#fff', color: C.ink, padding: '4px 9px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>{l.stay}</div>
                        )}
                      </div>
                    ) : (
                      <ImgPh kind="housing" tone={l.tone} height={150} badge={l.stay}/>
                    )}
                  </Link>
               
                  <div style={{ padding: '14px 16px 16px' }}>
                    <h4 style={{ margin: 0, fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.25 }}>{l.title}</h4>
                    <div style={{ marginTop: 4, fontSize: 12.5, color: C.ink3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="pin" size={13} color={C.ink3}/> {l.city}
                    </div>
                    <div className="num" style={{ marginTop: 10, fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.saffronDk, letterSpacing: '-0.02em' }}>{l.rent}</div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Tag color={C.ink2} bg={C.bgDeep}>{l.type}</Tag>
                      <Tag color={C.ink2} bg={C.bgDeep}>{l.size}</Tag>
                      <Tag color={C.ink2} bg={C.bgDeep}>{l.gender}</Tag>
                    </div>
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={l.host} size={26} style={{ fontSize: 10 }}/>
                        <span style={{ fontSize: 12, color: C.ink3, fontWeight: 600 }}>{l.host}</span>
                      </div>
                      <Btn kind="primary" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setContactTarget({ name: l.host, role: 'Host' }); setContactOpen(true); }}>Contact</Btn>
                    </div>
                  </div>
                </Card>
              </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Requirements */}
      <section>
        <SectionHead title="Members looking for a place" subtitle="Reach out if you have something matching" action="Post requirement" onAction={() => setPostReqOpen(true)}/>
        <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {loadingRequests ? (
            <div style={{ padding: 40, color: C.ink3 }}>Loading requests...</div>
          ) : (
            requestsData.map((r, i) => {
              const isReqSaved = reqSaved.has(i);
              return (
              <Card key={i} interactive>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <Avatar name={r.name} size={42} style={{ fontSize: 16 }}/>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, marginTop: 1 }}>Looking in {r.looking}</div>
                  </div>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: C.ink2, fontWeight: 500, lineHeight: 1.5 }}>“{r.note}”</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '10px 0', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Budget</div>
                    <div className="num" style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: C.ink, marginTop: 2 }}>{r.budget}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Move-in</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginTop: 2 }}>{r.when}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <Btn kind="primary" size="sm" full onClick={() => { setContactTarget({ name: r.name, role: 'Seeker' }); setContactOpen(true); }}>Reach out</Btn>
                </div>
              </Card>
              );
            })
          )}
        </div>
      </section>
      
      <PostHousingModal isOpen={postListingOpen} onClose={() => setPostListingOpen(false)}/>
      <BookModal
        isOpen={postReqOpen} onClose={() => setPostReqOpen(false)}
        title="Post Requirement" marathi="गरज"
        submitLabel="Post requirement"
        fields={[
          { key: 'looking', label: 'Looking for', placeholder: 'Select...', options: [
            { value: 'pg', label: 'Paying Guest' },
            { value: 'shared-room', label: 'Shared Room' },
            { value: 'flat-sharing', label: 'Flat Sharing' },
          ]},
          { key: 'country', label: 'Preferred Country', placeholder: 'Select country...', options: [
            { value: 'usa', label: 'USA' },
            { value: 'canada', label: 'Canada' },
            { value: 'uk', label: 'UK' },
            { value: 'australia', label: 'Australia' },
            { value: 'uae', label: 'UAE' },
            { value: 'germany', label: 'Germany' },
            { value: 'singapore', label: 'Singapore' },
            { value: 'india', label: 'India' },
          ]},
          { key: 'city', label: 'City', placeholder: 'Boston, MA' },
          { key: 'moveIn', label: 'Move-in Date', type: 'date' },
          { key: 'duration', label: 'Expected Duration', placeholder: 'e.g. 6 months, 1 year' },
          { key: 'budget', label: 'Monthly Budget Range', placeholder: '$800 - $1,200 / mo' },
          { key: 'intro', label: 'Intro', multiline: true, placeholder: 'Tell us about yourself — student, professional, vegetarian, quiet...' },
        ]}
      />
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} title={`Contact ${contactTarget.name}`} subtitle={`Regarding housing (${contactTarget.role})`}/>
      <InfoModal 
        isOpen={infoOpen} onClose={() => setInfoOpen(false)} 
        title="How it works" 
        content={
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li><b>Post your listing or requirement:</b> Easily share what you are offering or looking for in the housing market.</li>
            <li><b>Connect with community:</b> Trusted members of the Marathi community will see your post and can reach out directly.</li>
            <li><b>Direct communication:</b> We facilitate the initial connection, and you take it from there via chat or phone.</li>
            <li><b>Zero fees:</b> This is a community service, free for all members.</li>
          </ul>
        } 
      />
      <FilterModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}
