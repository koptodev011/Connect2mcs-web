'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Tag, ImgPh, PageHeader } from '@/components/primitives';
import { ApplyModal } from '@/components/FormModals';
import type { Scholarship, Internship } from '@/data/learn';

type DetailItem = (Scholarship & { type: 'scholarship' }) | (Internship & { type: 'internship' });

export default function LearnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<DetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/data/scholarships').then(res => res.json()),
      fetch('/api/data/internships').then(res => res.json())
    ])
    .then(([sData, iData]) => {
      const sch = (sData as Scholarship[]).find(s => s.id === id);
      if (sch) {
        setItem({ ...sch, type: 'scholarship' });
      } else {
        const int = (iData as Internship[]).find(i => i.id === id);
        if (int) {
          setItem({ ...int, type: 'internship' });
        }
      }
      setLoading(false);
    })
    .catch(console.error);
  }, [id]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: C.ink3 }}>Loading details...</div>;
  }

  if (!item) {
    return notFound();
  }

  const isScholarship = item.type === 'scholarship';
  const title = isScholarship ? item.title : item.role;
  const org = isScholarship ? item.org : item.co;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <Link href="/learn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.ink3, textDecoration: 'none', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <Icon name="chevL" size={14}/> Back to Learn
        </Link>
        <PageHeader
          title={title}
          subtitle={`Offered by ${org}`}
          actions={
            <Btn kind={applied ? 'soft' : 'primary'} size="lg" onClick={() => !applied && setApplyOpen(true)}>
              {applied ? 'Application Submitted ✓' : 'Apply Now'}
            </Btn>
          }
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }} className="mob-stack">
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ImgPh height={280} tone={item.tone} label={title} />
          
          <Card pad={32}>
            <h3 style={{ margin: '0 0 16px', fontFamily: F.display, fontSize: 20, color: C.ink, letterSpacing: '-0.02em' }}>About the Opportunity</h3>
            <p style={{ margin: '0 0 20px', fontSize: 15, color: C.ink2, lineHeight: 1.6 }}>
              This {isScholarship ? 'scholarship' : 'internship'} is designed for exceptional individuals looking to advance their career and education. 
              Successful candidates will demonstrate strong commitment to their field and our community values.
            </p>
            
            <h3 style={{ margin: '0 0 16px', fontFamily: F.display, fontSize: 18, color: C.ink, letterSpacing: '-0.02em' }}>Eligibility Criteria</h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: C.ink2, fontSize: 15, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Must be of Marathi origin or heavily involved in the community.</li>
              {isScholarship ? (
                <>
                  <li>Pursuing studies in {item.field}.</li>
                  <li>Exceptional academic standing.</li>
                </>
              ) : (
                <>
                  <li>Available for the entire {item.dur} duration.</li>
                  <li>Based in {item.loc} or willing to relocate/work remotely as specified.</li>
                </>
              )}
            </ul>
          </Card>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card pad={24}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                {isScholarship ? 'Award Amount' : 'Stipend'}
              </div>
              <div className="num" style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
                {isScholarship ? item.amount : item.stipend}
              </div>
            </div>
            
            {isScholarship ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Field of Study</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{item.field}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Deadline</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.brick }}>{item.deadline}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                  {item.eligible ? <Tag color={C.green} bg={C.greenLt}>● Eligible</Tag> : <Tag color={C.brick} bg="#FAE0DA">● Closed</Tag>}
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Location</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{item.loc}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Duration</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{item.dur} ({item.when})</div>
                </div>
              </>
            )}
            
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.line}` }}>
              <Btn kind={applied ? 'soft' : 'primary'} size="lg" full onClick={() => !applied && setApplyOpen(true)}>
                {applied ? 'Application Submitted ✓' : 'Apply Now'}
              </Btn>
            </div>
          </Card>
        </div>
      </div>

      <ApplyModal 
        isOpen={applyOpen} 
        onClose={() => setApplyOpen(false)} 
        itemName={title} 
        onSubmit={(data) => {
          setApplied(true);
          // In a real app, this would post to a backend to update user's applications
        }} 
      />
    </div>
  );
}
