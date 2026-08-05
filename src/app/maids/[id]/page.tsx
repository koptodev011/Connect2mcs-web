'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import { Card, SectionHead, Btn, Avatar, useGlobalToast } from '@/components/primitives';
import Icon from '@/components/Icon';
import { helpers } from '@/data/maids';

export default function MaidDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const fallbackHelper = helpers.find(h => h.id === resolvedParams.id) || null;
  const [helper, setHelper] = useState(fallbackHelper);
  const [loading, setLoading] = useState(!fallbackHelper);
  const toast = useGlobalToast();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/data/maids?id=${encodeURIComponent(resolvedParams.id)}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load maid details');
        return response.json();
      })
      .then(data => setHelper(data))
      .catch(error => console.error('Maid details API error:', error))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: C.ink3 }}>Loading maid profile...</div>;
  }

  if (!helper) notFound();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'start' }}>
      
      {/* Left Column: Profile Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Top Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/maids" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, color: C.ink2, fontWeight: 600, fontSize: 14 }}>
            <span style={{ display: 'flex', transform: 'rotate(90deg)' }}><Icon name="chev" size={16} color={C.ink2} /></span> Maid Profile
          </Link>
          <button style={{ background: isSaved ? C.brick : 'transparent', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsSaved(!isSaved)}>
            <Icon name="heart" size={18} color={isSaved ? '#fff' : C.ink2} />
          </button>
        </div>

        {/* Profile Header */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar name={helper.name} size={96} style={{ fontSize: 32 }} />
            {helper.verified && (
              <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#fff', borderRadius: '50%', padding: 4 }}>
                <div style={{ background: C.green, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="verify" size={14} color="#fff" />
                </div>
              </div>
            )}
          </div>
          <h1 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, margin: '16px 0 6px', color: C.ink }}>
            {helper.name}
          </h1>
          <div style={{ fontSize: 14, color: C.ink2, fontWeight: 500 }}>
            {helper.services} {helper.tag && `· ${helper.tag}`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: C.ink3, marginTop: 8 }}>
            <Icon name="pin" size={14} color={C.ink3} /> {helper.location}
          </div>
          {helper.verified && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <span style={{ background: '#DCFCE7', color: C.green, padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>ID Verified</span>
              <span style={{ background: '#DCFCE7', color: C.green, padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Police Verified</span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <Card pad={16} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.saffron }}>{helper.rating}</div>
            <div style={{ fontSize: 11, color: C.ink3, fontWeight: 500, marginTop: 4 }}>Rating</div>
          </div>
          <div style={{ width: 1, height: 30, background: C.line }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.brick }}>{helper.jobs.split(' ')[0]}</div>
            <div style={{ fontSize: 11, color: C.ink3, fontWeight: 500, marginTop: 4 }}>Jobs Done</div>
          </div>
          <div style={{ width: 1, height: 30, background: C.line }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{helper.experience.split(' ')[0]} yrs</div>
            <div style={{ fontSize: 11, color: C.ink3, fontWeight: 500, marginTop: 4 }}>Experience</div>
          </div>
          <div style={{ width: 1, height: 30, background: C.line }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{helper.languages.length}</div>
            <div style={{ fontSize: 11, color: C.ink3, fontWeight: 500, marginTop: 4 }}>Languages</div>
          </div>
        </Card>

        {/* Package Card */}
        <div style={{
          background: 'linear-gradient(135deg, #E26A1F 0%, #B8471E 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(226, 106, 31, 0.25)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, color: 'rgba(255,255,255,0.8)' }}>
            Monthly Package
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: F.display, letterSpacing: '-0.02em' }}>{helper.price.split('/')[0]}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>/ month</div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 13, fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={16} color="#fff" /> {helper.tag === 'Live-in' ? 'Live-in' : helper.workingHours}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="cal" size={16} color="#fff" /> {helper.days}</span>
          </div>
        </div>

        {/* About */}
        <div>
          <h3 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 12 }}>About</h3>
          <p style={{ fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: 0 }}>
            {helper.about}
          </p>
        </div>

        {/* Services & Skills */}
        <Card pad={20}>
          <h3 style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 16 }}>Services & Skills</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {helper.skills.map((skill, idx) => (
              <span key={idx} style={{ background: '#FFF8EB', border: `1px solid ${C.saffronLt}`, color: C.saffronDk, padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {skill}
              </span>
            ))}
          </div>
        </Card>

        {/* Availability */}
        <Card pad={20}>
          <h3 style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 16 }}>Availability</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${C.line}`, paddingBottom: 12 }}>
              <span style={{ color: C.ink2, fontWeight: 500 }}>Working Hours</span>
              <span style={{ fontWeight: 700, color: C.ink }}>{helper.workingHours}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${C.line}`, paddingBottom: 12 }}>
              <span style={{ color: C.ink2, fontWeight: 500 }}>Days</span>
              <span style={{ fontWeight: 700, color: C.ink }}>{helper.days}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: C.ink2, fontWeight: 500 }}>Start Date</span>
              <span style={{ fontWeight: 700, color: C.green }}>{helper.startDate}</span>
            </div>
          </div>
        </Card>

        {/* Reviews */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink, margin: 0 }}>Reviews ({helper.reviews.length})</h3>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}><span style={{ color: C.saffron }}>★★★★★</span> {helper.rating}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {helper.reviews.map((rev, idx) => (
              <Card key={idx} pad={20} style={{ background: C.bgDeep }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{rev.name}</div>
                  <div style={{ color: C.saffron, fontSize: 12 }}>{'★'.repeat(rev.rating)}</div>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: 14, color: C.ink2, lineHeight: 1.5 }}>
                  {rev.text}
                </p>
                <div style={{ fontSize: 11, color: C.ink3, fontWeight: 500 }}>{'date' in rev ? rev.date : 'Recently'}</div>
              </Card>
            ))}
            {helper.reviews.length === 0 && (
              <div style={{ fontSize: 14, color: C.ink3, fontStyle: 'italic' }}>No written reviews yet.</div>
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Sticky Booking Form */}
      <div style={{ position: 'sticky', top: 100 }}>
        <Card pad={24} style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.08)', border: 'none' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: `1px solid ${C.line}`, paddingBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={helper.name} size={48} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {helper.name} {helper.verified && <Icon name="verify" size={14} color={C.green} />}
                </div>
                <div style={{ fontSize: 11, color: C.ink3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: C.saffron }}>★</span> {helper.rating} · {helper.jobs.split(' ')[0]} jobs
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: C.ink3, fontWeight: 600 }}>from</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.brick }}>{helper.price.split('/')[0]}</div>
            </div>
          </div>

          <h3 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink, margin: '0 0 20px' }}>Book Helper</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Services Needed</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['House Cleaning', 'Cooking', 'Childcare', 'Elder Care', 'Laundry'].map(s => (
                  <button key={s} style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${C.lineMid}`, background: s === 'House Cleaning' || s === 'Cooking' ? C.bgDeep : '#fff', color: C.ink2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Arrangement</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Live-in', 'Full-time (8 hrs)', 'Part-time (4 hrs)', 'Hourly'].map(a => (
                  <button key={a} style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${C.lineMid}`, background: a === helper.tag ? C.saffronLt : '#fff', color: a === helper.tag ? C.saffronDk : C.ink2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{a}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Start Date</label>
                <div style={{ padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 8, fontSize: 13, color: C.ink3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="cal" size={16} /> Select</span>
                  <Icon name="chev" size={14} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>End Date</label>
                <div style={{ padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 8, fontSize: 13, color: C.ink3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="cal" size={16} /> Select</span>
                  <Icon name="chev" size={14} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Home Address</label>
              <input type="text" placeholder="Flat, building, area, city" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 8, fontSize: 13, fontFamily: F.ui, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Additional Notes <span style={{ color: C.ink4, fontWeight: 500 }}>(optional)</span></label>
              <textarea placeholder="Any specific requirements or preferences" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 8, fontSize: 13, fontFamily: F.ui, outline: 'none', minHeight: 60, resize: 'none' }} />
            </div>

            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 16px', borderRadius: 8, display: 'flex', gap: 12 }}>
              <Icon name="verify" size={20} color={C.green} />
              <div style={{ fontSize: 11.5, color: '#065F46', lineHeight: 1.4, fontWeight: 500 }}>
                First week is a trial. Full refund if not satisfied. Backed by MCS guarantee.
              </div>
            </div>

            <Btn kind="primary" full style={{ background: C.saffron, border: 'none', height: 48, fontSize: 15, borderRadius: 12 }} onClick={() => toast.add('Booking request sent successfully!', 'success')}>Send Booking Request →</Btn>
          </div>
        </Card>
      </div>

    </div>
  );
}
