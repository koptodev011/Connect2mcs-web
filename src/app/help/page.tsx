'use client';

import { useState, useEffect } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, Avatar, SectionHead, PageHeader } from '@/components/primitives';
import { HelpTopic, FAQ } from '@/data/help';

export default function HelpPage() {
  const [topicsData, setTopicsData] = useState<HelpTopic[]>([]);
  const [faqsData, setFaqsData] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/data/help-topics').then(res => res.json()),
      fetch('/api/data/faqs').then(res => res.json())
    ])
    .then(([tData, fData]) => {
      setTopicsData(Array.isArray(tData) ? tData : []);
      setFaqsData(Array.isArray(fData) ? fData : []);
      setLoading(false);
    })
    .catch(console.error);
  }, []);

  const [active, setActive] = useState('All');
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Help & Support"
        marathi="मदत"
        subtitle="Find answers, contact your Mandal, or open a support ticket"
      />

      {/* Big search */}
      <Card pad={28} style={{
        background: 'linear-gradient(135deg, #FFF8EB 0%, #FFE9D6 60%, #FFD9A6 100%)',
        border: `1px solid rgba(184, 137, 60, 0.18)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <svg style={{ position: 'absolute', top: -30, right: -30, opacity: 0.16 }} width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
          <g fill="none" stroke={C.saffronDk} strokeWidth="1">
            <circle cx="100" cy="100" r="84"/><circle cx="100" cy="100" r="60"/><circle cx="100" cy="100" r="36"/>
          </g>
        </svg>
        <div style={{ position: 'relative', maxWidth: 720 }}>
          <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            How can we help, Anuja?
          </h2>
          <p style={{ margin: '8px 0 18px', fontSize: 14, color: C.ink2, fontWeight: 500, lineHeight: 1.55 }}>
            Browse topics, search FAQs, or reach out to your Mandal leadership directly.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: '#fff', borderRadius: 12, border: `1px solid ${C.line}`, boxShadow: '0 2px 8px rgba(15,14,12,0.05)' }}>
            <Icon name="search" size={18} color={C.ink3}/>
            <input placeholder={'Try “How do I post a job?” or “delete my account”'} style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
            }}/>
            <Btn kind="primary" size="sm">Search</Btn>
          </div>
        </div>
      </Card>

      {/* Topic tiles */}
      <section>
        <SectionHead title="Browse by topic" subtitle="Step-by-step guides for every feature"/>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }}>
          {['All', 'Getting started', 'Mandals', 'Jobs', 'Community', 'Privacy'].map(t => (
            <Pill key={t} active={active === t} onClick={() => setActive(t)}>{t}</Pill>
          ))}
        </div>
        <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {loading ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', gridColumn: '1/-1', color: C.ink3, fontSize: 13 }}>
              Loading topics...
            </div>
          ) : topicsData.map((t, i) => (
            <Card key={`${t.id || i}`} interactive>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: C.saffronLt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={t.icon || 'map'} size={20} color={C.brick}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: C.ink3, fontWeight: 600, letterSpacing: '0.04em', marginTop: 2 }}>{t.count || 5} guides</div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.ink2, fontWeight: 500, lineHeight: 1.5 }}>{t.desc}</p>
              <div style={{ marginTop: 12, fontSize: 12.5, color: C.saffronDk, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Open guides <Icon name="chevR" size={14}/>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ + contact */}
      <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* FAQs */}
        <Card pad={0}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>Frequently asked</div>
            <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 2 }}>Most-viewed answers this week</div>
          </div>
          {loading ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: C.ink3, fontSize: 13 }}>
              Loading FAQs...
            </div>
          ) : faqsData.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={`${f.id || i}`} style={{ borderBottom: i < faqsData.length - 1 ? `1px solid ${C.line}` : 'none' }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: '100%', padding: '16px 20px', background: 'transparent',
                    border: 'none', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>{f.q}</span>
                  <Icon name="chev" size={16} color={C.ink3}
                    s={1.7}
                  />
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 18px', fontSize: 13.5, color: C.ink2, fontWeight: 500, lineHeight: 1.6 }}>
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        {/* Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card pad={20}>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>Contact your Mandal</div>
            <p style={{ margin: '6px 0 14px', fontSize: 13, color: C.ink3, fontWeight: 500, lineHeight: 1.5 }}>
              For Mandal-specific questions (membership, events, dues), reach the BMM committee directly.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.bgDeep, borderRadius: 10 }}>
              <Avatar name="Boston Marathi Mandal" size={36}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>BMM Boston · Anil Joshi</div>
                <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>Committee secretary</div>
              </div>
              <Btn kind="outline" size="sm"><Icon name="chat" size={14}/></Btn>
            </div>
          </Card>

          <Card pad={20}>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>Submit a request</div>
            <p style={{ margin: '6px 0 14px', fontSize: 13, color: C.ink3, fontWeight: 500, lineHeight: 1.5 }}>
              For platform issues — bugs, account, billing — open a support ticket.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select style={{ padding: '10px 12px', border: `1px solid ${C.lineMid}`, borderRadius: 10, background: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                <option>Choose category…</option>
                <option>Account & sign-in</option>
                <option>Bug report</option>
                <option>Mandal verification</option>
                <option>Inappropriate content</option>
                <option>Something else</option>
              </select>
              <textarea placeholder="Briefly describe what happened…" rows={4} style={{
                padding: '10px 12px', border: `1px solid ${C.lineMid}`, borderRadius: 10,
                fontSize: 13, fontWeight: 500, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5,
              }}/>
              <Btn kind="primary" size="md" full>Send request</Btn>
              <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, textAlign: 'center' }}>
                Median response time: <strong style={{ color: C.green }}>under 6 hours</strong>
              </div>
            </div>
          </Card>

          <Card pad={20} style={{ background: C.surfaceAlt }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag color={C.green} bg={C.greenLt}>● Live</Tag>
              <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>All systems operational</div>
            </div>
            <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, marginTop: 6 }}>Last incident · 11 days ago</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
