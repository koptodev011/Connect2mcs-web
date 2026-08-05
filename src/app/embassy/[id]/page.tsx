'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import { Card, Btn, useGlobalToast } from '@/components/primitives';
import Icon from '@/components/Icon';
import { missions } from '@/data/embassy';

export default function EmbassyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const fallbackMission = missions.find(m => m.id === resolvedParams.id) || null;
  const [mission, setMission] = useState(fallbackMission);
  const [loading, setLoading] = useState(!fallbackMission);
  const toast = useGlobalToast();

  useEffect(() => {
    fetch(`/api/data/embassy?id=${encodeURIComponent(resolvedParams.id)}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load embassy details');
        return response.json();
      })
      .then(data => setMission(data))
      .catch(error => console.error('Embassy details API error:', error))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: C.ink3 }}>Loading embassy details...</div>;
  }

  if (!mission) notFound();

  const mapQuery = encodeURIComponent(`${mission.name} ${mission.address}`);
  const websiteUrl = mission.website.startsWith('http') ? mission.website : `https://${mission.website}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      
      {/* Top Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/embassy" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, color: C.ink2, fontWeight: 600, fontSize: 14 }}>
          <span style={{ display: 'flex', transform: 'rotate(90deg)' }}><Icon name="chev" size={16} color={C.ink2} /></span> Back to Directory
        </Link>
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => toast.add('Notifications coming soon', 'success')}>
          <Icon name="bell" size={20} color={C.ink2} />
        </button>
      </div>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1A3673 0%, #11234D 100%)',
        borderRadius: 22,
        padding: '32px 36px',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        boxShadow: '0 8px 24px rgba(26, 54, 115, 0.2)',
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 }}>🏛️</span>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.saffron, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              भारत का दूतावास
            </div>
            <h1 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, margin: '4px 0 6px', letterSpacing: '-0.02em' }}>
              {mission.name}
            </h1>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="pin" size={14} color="rgba(255,255,255,0.8)" /> {mission.address}
            </div>
          </div>
        </div>
        
        <div style={{ position: 'absolute', right: -40, top: -40, opacity: 0.1, fontSize: 240, userSelect: 'none' }}>☸</div>

        <div style={{ display: 'flex', gap: 12, marginTop: 32, position: 'relative', zIndex: 1 }}>
          <Btn kind="outline" style={{ flex: 1, background: '#fff', color: '#1A3673', borderColor: '#fff' }} iconL="phone" onClick={() => window.open(`tel:${mission.telephone}`, '_self')}>Call</Btn>
          <Btn kind="outline" style={{ flex: 1, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} iconL="map" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(mission.name + ' ' + mission.address)}`, '_blank')}>Directions</Btn>
          <button style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => window.open(websiteUrl, '_blank', 'noopener,noreferrer')}>
            <Icon name="globe" size={20} color="#fff" />
          </button>
        </div>
      </div>

      {/* Quick Info Bar */}
      <Card pad={20} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: mission.status === 'Open' ? C.green : C.brick }}>{mission.status}</div>
          <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 4 }}>{mission.hours}</div>
        </div>
        <div style={{ width: 1, height: 40, background: C.line }} />
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>Mon–Fri</div>
          <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 4 }}>Working days</div>
        </div>
        <div style={{ width: 1, height: 40, background: C.line }} />
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1A3673' }}>{mission.distance}</div>
          <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 4 }}>From you</div>
        </div>
      </Card>

      {/* Location Map */}
      <Card pad={0} style={{ overflow: 'hidden', position: 'relative', minHeight: 260 }}>
        <iframe
          title={`${mission.name} map`}
          src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ width: '100%', height: 300, border: 0, display: 'block' }}
        />
        <Btn
          kind="dark"
          size="sm"
          iconL="pin"
          style={{ position: 'absolute', left: '50%', bottom: 18, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
          onClick={() => window.open(`https://maps.google.com/?q=${mapQuery}`, '_blank')}
        >
          View on map
        </Btn>
      </Card>
      {/* Services Offered */}
      <Card pad={24}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.display }}>
          <Icon name="verify" size={20} color={C.ink2} /> Services Offered
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {mission.services.map((service, idx) => (
            <div key={idx} style={{ background: C.bgDeep, border: `1px solid ${C.line}`, padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.saffronDk }} /> {service}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, background: '#FFF8EB', padding: '12px 16px', borderRadius: 8, fontSize: 12, color: C.saffronDk, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="globe" size={16} color={C.saffronDk} />
          Appointments & applications are handled via the official BLS / VFS portal.
        </div>
      </Card>

      {/* Contact Details */}
      <Card pad={24}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.display }}>
          <Icon name="phone" size={20} color={C.ink2} /> Contact Details
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 40, height: 40, background: C.bgDeep, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="phone" size={18} color={C.ink3} /></div>
            <div>
              <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginBottom: 2 }}>Telephone</div>
              <a href={`tel:${mission.telephone}`} style={{ fontSize: 15, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>{mission.telephone}</a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 40, height: 40, background: C.bgDeep, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="globe" size={18} color={C.ink3} /></div>
            <div>
              <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginBottom: 2 }}>Email</div>
              <a href={`mailto:${mission.email}`} style={{ fontSize: 15, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>{mission.email}</a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 40, height: 40, background: C.bgDeep, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="link" size={18} color={C.ink3} /></div>
            <div>
              <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginBottom: 2 }}>Website</div>
              <a href={`https://${mission.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600, color: C.green, textDecoration: 'none' }}>{mission.website}</a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 40, height: 40, background: C.bgDeep, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={18} color={C.ink3} /></div>
            <div>
              <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginBottom: 2 }}>Address</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.4 }}>{mission.address}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Jurisdiction */}
      <Card pad={24} style={{ background: '#F8FAFC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 16, fontWeight: 700, color: '#1A3673', fontFamily: F.display }}>
          <Icon name="verify" size={20} color="#1A3673" /> Jurisdiction
        </div>
        <p style={{ margin: 0, fontSize: 14, color: C.ink2, lineHeight: 1.6, fontWeight: 500 }}>
          {mission.jurisdiction}
        </p>
      </Card>
      
      <div style={{ textAlign: 'center', fontSize: 11, color: C.ink4, marginTop: 16, marginBottom: 32 }}>
        Official Information - Ministry of External Affairs, Government of India
      </div>

    </div>
  );
}
