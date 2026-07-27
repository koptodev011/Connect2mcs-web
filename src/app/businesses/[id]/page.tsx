'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Rating, Tag } from '@/components/primitives';
import { Business } from '@/data/businesses';
import { toneBg, toneColor } from '@/lib/tones';

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/businesses')
      .then(res => res.json())
      .then((data: Business[]) => {
        const found = data.find(b => b.id === id);
        if (found) setBusiness(found);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div style={{ padding: 40, color: C.ink3, fontSize: 14 }}>Loading business details...</div>;
  }

  if (!business) return notFound();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Link href="/businesses" style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.ink3, fontSize: 13, fontWeight: 600, textDecoration: 'none', width: 'fit-content' }}>
        <Icon name="chevL" size={14} color={C.ink3} /> Back to Directory
      </Link>
      
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '40px 36px', background: toneBg[business.tone], borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 18, flexShrink: 0,
              background: '#fff', color: toneColor[business.tone],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 700, fontFamily: F.display,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              {business.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontFamily: F.display, fontSize: 32, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{business.name}</h1>
                {business.verified && <Icon name="verify" size={24} color={C.green} />}
              </div>
              <div style={{ fontSize: 16, color: C.ink2, fontWeight: 500, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {business.owner} · <Rating value={business.rating} count={business.reviews} size="lg" />
                {business.phone && <span style={{ color: C.ink3 }}>· {business.phone}</span>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '32px 36px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            <Tag color={toneColor[business.tone]} bg={toneBg[business.tone]}>{business.cat}</Tag>
            <Tag color={C.ink2} bg={C.bgDeep}><Icon name="pin" size={13} color={C.ink3}/> {business.city}</Tag>
            {business.mandal && business.mandal !== '-' && <Tag color={C.ink2} bg={C.bgDeep}><Icon name="star" size={13} color={C.ink3}/> {business.mandal}</Tag>}
            <Tag color={C.ink2} bg={C.bgDeep}>{business.years}y experience</Tag>
          </div>

          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>About</h3>
          <p style={{ margin: '0 0 24px', fontSize: 15, color: C.ink2, fontWeight: 500, lineHeight: 1.6, maxWidth: 640 }}>
            {business.desc} We are proud to serve the local community and have been a part of the {business.mandal} network for many years.
          </p>

          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Services</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            {business.services.map(s => <Tag key={s} color={C.ink2} bg={C.bgDeep}>{s}</Tag>)}
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 32, borderTop: `1px solid ${C.line}` }}>
            {business.phone ? (
              <a href={`tel:${business.phone}`} style={{ textDecoration: 'none' }}>
                <Btn kind="primary" size="lg" iconL="chat">Call {business.phone}</Btn>
              </a>
            ) : (
              <Btn kind="primary" size="lg" iconL="chat">Contact Business</Btn>
            )}
            <Btn kind="outline" size="lg"><Icon name="globe" size={18} color={C.ink}/> Website</Btn>
            <Btn kind="outline" size="lg"><Icon name="share" size={18} color={C.ink}/></Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
