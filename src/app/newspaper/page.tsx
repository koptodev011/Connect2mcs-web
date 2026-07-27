'use client';

import { useState, useEffect } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, ImgPh, SectionHead, PageHeader } from '@/components/primitives';
import type { NewspaperPaper } from '@/data/newspaper';

export default function NewspaperPage() {
  const [papersData, setPapersData] = useState<NewspaperPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/newspapers')
      .then(res => res.json())
      .then(data => {
        setPapersData(data);

        setLoading(false);
      })
      .catch(console.error);
  }, []);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Marathi Newspaper"
        marathi="वृत्तपत्र"
        subtitle="5 major Marathi dailies · today's top stories · updated every morning"
        actions={<>
          <Btn kind="ghost" size="md" iconL="bell">Subscribe to digest</Btn>
          <Btn kind="dark"  size="md" iconL="plus">Submit a story</Btn>
        </>}
      />


      {/* Browse all papers */}
      <section>
        <SectionHead title="All Marathi papers" subtitle="Quick stats on Maharashtra's major dailies"/>
        <div className="mob-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {papersData.map((p: any) => (
            <Card key={p.id} pad={0} interactive style={{ overflow: 'hidden' }} onClick={() => { if (p.url && p.url !== '#') window.open(p.url, '_blank'); }}>
              {p.image ? (
                <div style={{ height: 80, overflow: 'hidden' }}>
                  <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                </div>
              ) : (
                <ImgPh kind="news" tone={p.tone} height={80}/>
              )}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontFamily: F.deva, fontSize: 18, color: C.saffronDk, fontWeight: 400 }}>{p.dev}</div>
                <div style={{ fontFamily: F.display, fontSize: 12, fontWeight: 600, color: C.ink, marginTop: 2 }}>{p.id}</div>
                <div style={{ fontSize: 11, color: C.ink3, fontWeight: 500, marginTop: 4 }}>{p.readers}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
