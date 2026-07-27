'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Tag, ImgPh, SectionHead, PageHeader, Stat } from '@/components/primitives';
import { FilterModal, ApplyModal } from '@/components/FormModals';
import { toneBg, toneColor } from '@/lib/tones';

import type { Scholarship, Internship } from '@/data/learn';
import type { Tone } from '@/lib/tokens';

type Tab = 'scholarships' | 'internships';

const statusStyles = {
  pending:  { bg: '#FFF3DB', fg: '#8C5E0E', label: 'Pending review' },
  approved: { bg: C.greenLt, fg: C.green,   label: 'Approved' },
  rejected: { bg: '#FAE0DA', fg: C.brick,   label: 'Not selected' },
  open:     { bg: C.greenLt, fg: C.green,   label: 'Open' },
} as const;

export default function LearnPage() {
  const [scholarshipsData, setScholarshipsData] = useState<Scholarship[]>([]);
  const [internshipsData, setInternshipsData] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [applyTarget, setApplyTarget] = useState<{ id: string, type: 'scholarship' | 'internship', name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch('/api/data/scholarships').then(res => res.json()),
      fetch('/api/data/internships').then(res => res.json())
    ])
    .then(([sData, iData]) => {
      setScholarshipsData(Array.isArray(sData) ? sData : []);
      setInternshipsData(Array.isArray(iData) ? iData : []);
      setLoading(false);
    })
    .catch(console.error);
  }, []);

  const [tab, setTab] = useState<Tab>('scholarships');
  const [sortSchBy, setSortSchBy] = useState('Deadline');
  const [sortIntBy, setSortIntBy] = useState('Newest');
  
  const [appliedSch, setAppliedSch] = useState<Set<string>>(new Set(['pmet']));
  const [appliedInt, setAppliedInt] = useState<Set<string>>(new Set());
  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id); else n.add(id);
    setter(n);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Learn & Earn"
        marathi="शिक्षण"
        subtitle={`${loading ? '...' : scholarshipsData.length} scholarships · ${loading ? '...' : internshipsData.length} internships · curated for Marathi students worldwide`}
        actions={<>
          <Btn kind="ghost" size="md" iconL="filter" onClick={() => setFilterOpen(true)}>Filters</Btn>
          <Btn kind="dark" size="md" iconL="plus">Post opportunity</Btn>
        </>}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.line}`, padding: '0 4px' }}>
        {(['scholarships', 'internships'] as Tab[]).map(t => {
          const active = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} className={active ? undefined : 'nav-int'} style={{
              padding: '12px 20px', background: 'transparent', border: 'none',
              fontSize: 14, fontWeight: active ? 700 : 600,
              color: active ? C.saffronDk : C.ink2,
              borderBottom: `2px solid ${active ? C.saffron : 'transparent'}`,
              marginBottom: -1, cursor: 'pointer', textTransform: 'capitalize',
              fontFamily: F.ui, letterSpacing: '-0.005em',
            }}>
              {t === 'scholarships' ? `Scholarships · ${loading ? '...' : scholarshipsData.length}` : `Internships · ${loading ? '...' : internshipsData.length}`}
            </button>
          );
        })}
      </div>

      {/* Stats strip */}
      <div className="mob-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { v: loading ? '-' : String(scholarshipsData.length), l: 'OPEN SCHOLARSHIPS', h: 'Worldwide' },
          { v: loading ? '-' : String(internshipsData.length), l: 'OPEN INTERNSHIPS', h: 'Various stipends' },
          { v: loading ? '-' : String(appliedSch.size + appliedInt.size), l: 'YOUR APPLICATIONS', h: 'Currently active' },
          { v: '$8.4K', l: 'AVG. AWARD', h: 'Across last cycle' }
        ].map((s, i) => (
          <Card key={i} pad={20}>
            <Stat value={s.v} label={s.l} hint={s.h}/>
          </Card>
        ))}
      </div>

      {/* Upcoming deadlines */}
      {!loading && <UpcomingDeadlines scholarships={scholarshipsData} internships={internshipsData} />}

      {/* My applications */}
      <Card pad={0}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>Your applications</div>
            <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 2 }}>Track status across scholarships and internships</div>
          </div>
          <Btn kind="ghost" size="sm">View all</Btn>
        </div>
        
        {loading ? (
          <div style={{ padding: '20px', color: C.ink3, fontSize: 13 }}>Loading your applications...</div>
        ) : (
          [
            ...Array.from(appliedSch).map(id => {
              const s = scholarshipsData.find(x => x.id === id);
              return s ? { item: s.org, kind: 'Scholarship', status: 'pending' as const, when: 'Submitted today' } : null;
            }).filter(Boolean),
            ...Array.from(appliedInt).map(id => {
              const it = internshipsData.find(x => x.id === id);
              return it ? { item: it.co, kind: 'Internship', status: 'pending' as const, when: 'Submitted today' } : null;
            }).filter(Boolean)
          ].map((a, i, arr) => {
            if (!a) return null;
            const st = statusStyles[a.status];
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, alignItems: 'center', padding: '14px 18px', borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{a.item}</div>
                  <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, marginTop: 2 }}>{a.kind}</div>
                </div>
                <span style={{ background: st.bg, color: st.fg, padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>● {st.label}</span>
                <span style={{ fontSize: 12, color: C.ink3, fontWeight: 500 }}>{a.when}</span>
                <Btn kind="outline" size="sm">View</Btn>
              </div>
            );
          })
        )}
      </Card>

      {/* Tab content */}
      {tab === 'scholarships' ? (
        <section>
          <SectionHead 
            title="Open scholarships" 
            subtitle="Filtered by your eligibility" 
            action={
              <select value={sortSchBy} onChange={e => setSortSchBy(e.target.value)} style={{ appearance: 'none', background: 'transparent', border: 'none', color: C.saffronDk, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                <option value="Deadline">Sort: Deadline</option>
                <option value="Amount">Sort: Amount</option>
              </select>
            }
          />
          <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {loading ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', gridColumn: '1/-1', color: C.ink3, fontSize: 13 }}>
                Loading scholarships...
              </div>
            ) : scholarshipsData.map((s, index) => {
              const isApplied = appliedSch.has(s.id);
              return (
                <Card 
                  key={`${s.id}-${index}`} 
                  pad={0} 
                  interactive 
                  className="mob-stack" 
                  style={{ overflow: 'hidden', display: 'grid', gridTemplateColumns: '180px 1fr' }}
                  onClick={() => router.push(`/learn/${s.id}`)}
                >
                  <ImgPh kind="scholarship" tone={s.tone} height="auto" style={{ minHeight: 180 }}/>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <h4 style={{ margin: 0, fontFamily: F.display, fontSize: 17, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.25 }}>{s.title}</h4>
                        <div style={{ fontSize: 12.5, color: C.ink3, fontWeight: 500, marginTop: 3 }}>{s.org}</div>
                      </div>
                      {s.eligible
                        ? <Tag color={C.green} bg={C.greenLt}>● Eligible</Tag>
                        : <Tag color={C.ink3} bg={C.bgDeep}>Check criteria</Tag>}
                    </div>
                    <div className="num" style={{ marginTop: 12, fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.saffronDk }}>{s.amount}</div>
                    <div style={{ fontSize: 12.5, color: C.ink3, fontWeight: 500, marginTop: 2 }}>
                      {s.field} {s.criteria ? <><br/><span style={{ fontSize: 11.5, color: C.ink4 }}>{s.criteria}</span></> : ''}
                    </div>
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: C.ink3, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Icon name="clock" size={13} color={C.ink3}/> Deadline {s.deadline}
                      </span>
                      <Btn
                        kind={isApplied ? 'soft' : (s.eligible ? 'primary' : 'outline')}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isApplied) {
                            setApplyTarget({ id: s.id, type: 'scholarship', name: s.title });
                          }
                        }}
                      >
                        {isApplied ? 'Applied ✓' : 'Apply'}
                      </Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ) : (
        <section>
          <SectionHead 
            title="Open internships" 
            subtitle="Curated picks · summer & fall cycles" 
            action={
              <select value={sortIntBy} onChange={e => setSortIntBy(e.target.value)} style={{ appearance: 'none', background: 'transparent', border: 'none', color: C.saffronDk, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                <option value="Newest">Sort: Newest</option>
                <option value="Closing soon">Sort: Closing soon</option>
              </select>
            }
          />
          <Card pad={0}>
            {loading ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: C.ink3, fontSize: 13 }}>
                Loading internships...
              </div>
            ) : internshipsData.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: C.ink3, fontSize: 13 }}>
                No internships found.
              </div>
            ) : internshipsData.map((it, i) => {
              const isApplied = appliedInt.has(it.id);
              return (
                <div 
                  key={`${it.id}-${i}`} 
                  className="mob-stack btn-int" 
                  style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto auto', gap: 16, padding: '16px 20px', alignItems: 'center', borderBottom: i < internshipsData.length - 1 ? `1px solid ${C.line}` : 'none', cursor: 'pointer' }}
                  onClick={() => router.push(`/learn/${it.id}`)}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: toneBg[it.tone], color: toneColor[it.tone], fontSize: 22, fontWeight: 700, fontFamily: F.display, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.logo}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{it.role}</span>
                      <Tag color={C.green} bg={C.greenLt}>{isApplied ? 'Applied' : 'Open'}</Tag>
                    </div>
                    <div style={{ fontSize: 12.5, color: C.ink3, marginTop: 2, fontWeight: 500 }}>{it.co} <span style={{ color: C.ink4 }}>·</span> {it.loc}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Tag color={C.ink2} bg={C.bgDeep}>{it.stipend}</Tag>
                      <Tag color={C.ink2} bg={C.bgDeep}>{it.dur}</Tag>
                      <Tag color={C.ink2} bg={C.bgDeep}>{it.when}</Tag>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: C.ink3, fontWeight: 600 }}>Apply by</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>20 May 2026</div>
                  </div>
                  <Btn
                    kind={isApplied ? 'soft' : 'primary'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isApplied) {
                        setApplyTarget({ id: it.id, type: 'internship', name: it.role });
                      }
                    }}
                  >
                    {isApplied ? 'Applied ✓' : 'Apply'}
                  </Btn>
                </div>
              );
            })}
          </Card>
        </section>
      )}

      <FilterModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
      {applyTarget && (
        <ApplyModal
          isOpen={true}
          onClose={() => setApplyTarget(null)}
          itemName={applyTarget.name}
          onSubmit={(data) => {
            if (applyTarget.type === 'scholarship') {
              setAppliedSch(s => new Set(s).add(applyTarget.id));
            } else {
              setAppliedInt(s => new Set(s).add(applyTarget.id));
            }
          }}
        />
      )}
    </div>
  );
}

function UpcomingDeadlines({ scholarships, internships }: { scholarships: Scholarship[], internships: Internship[] }) {
  const urgentThreshold = 30;

  // Synthesize upcoming deadlines from the fetched data
  const combined = [
    ...scholarships.map(s => ({
      kind: 'Scholarship',
      title: s.title,
      org: s.org,
      amount: s.amount,
      date: s.deadline,
      tone: s.tone,
      eligible: s.eligible,
      // Parse dates to estimate days left or random mockup
      daysLeft: Math.floor(Math.random() * 60) + 10,
    })),
    ...internships.map(i => ({
      kind: 'Internship',
      title: i.role,
      org: i.co,
      amount: i.stipend,
      date: i.when,
      tone: i.tone,
      eligible: true,
      daysLeft: Math.floor(Math.random() * 60) + 10,
    }))
  ].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5);

  return (
    <Card pad={0}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            Upcoming deadlines
            <span style={{ background: C.brick, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.04em' }}>
              {combined.filter(d => d.daysLeft <= urgentThreshold).length} urgent
            </span>
          </div>
          <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 2 }}>Scholarships and internships closing soon</div>
        </div>
        <Btn kind="ghost" size="sm" icon="arrow">All deadlines</Btn>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 0, minWidth: 'max-content' }}>
          {combined.map((d, i) => {
            const isUrgent = d.daysLeft <= urgentThreshold;
            const toneColors: Record<string, [string, string]> = {
              saffron: [C.saffronLt, C.saffronDk], brick: ['#FAE0DA', C.brick],
              gold: ['#F4E8CC', '#B8893C'], blue: ['#DCE5F4', C.blue],
              green: [C.greenLt, C.green],
            };
            const [bg, fg] = toneColors[d.tone] ?? [C.bgDeep, C.ink2];
            return (
              <div key={i} style={{
                padding: '16px 20px', borderRight: i < combined.length - 1 ? `1px solid ${C.line}` : 'none',
                minWidth: 220, display: 'flex', flexDirection: 'column', gap: 8,
                background: isUrgent ? '#FFFBF1' : '#fff',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    background: isUrgent ? C.brick : C.bgDeep,
                    color: isUrgent ? '#fff' : C.ink2,
                    fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 999,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    {isUrgent && '⚡ '}{d.daysLeft} days left
                  </span>
                  <span style={{ background: bg, color: fg, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {d.kind}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{d.title}</div>
                <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>{d.org}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: fg }}>{d.amount}</span>
                  <span style={{ fontSize: 11, color: C.ink3, fontWeight: 500 }}>Due {d.date}</span>
                </div>
                <Btn
                  kind={d.eligible ? 'primary' : 'outline'}
                  size="sm"
                  full
                >
                  {d.eligible ? 'Apply now' : 'Check eligibility'}
                </Btn>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
