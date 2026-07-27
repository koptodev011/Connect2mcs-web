'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, ImgPh, PageHeader, useGlobalToast } from '@/components/primitives';
import { Job } from '@/data/jobs';
import { toneBg, toneColor } from '@/lib/tones';
import { PostJobModal } from '@/components/FormModals';

const cats = ['All', 'Tech', 'Design', 'Editorial', 'Operations', 'Volunteer'];
const locs = ['Anywhere', 'India', 'USA', 'UK', 'Remote'];

export default function JobsPage() {
  const [jobsData, setJobsData] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [postJobOpen, setPostJobOpen] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    fetch('/api/data/jobs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobsData(data);
          if (data.length > 0) setActiveId(data[0].id);
        }
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const [activeCat, setActiveCat] = useState('All');
  const [activeLoc, setActiveLoc] = useState('Anywhere');
  const [activeExp, setActiveExp] = useState('Any experience');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filtered = jobsData.filter(j => {
    const matchCat = activeCat === 'All' || j.cat === activeCat;
    const matchLoc = activeLoc === 'Anywhere' || j.loc.toLowerCase().includes(activeLoc.toLowerCase());
    const matchQ = !searchQuery || 
      j.role.toLowerCase().includes(searchQuery.toLowerCase()) || 
      j.co.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchLoc && matchQ;
  });
  
  const [sortBy, setSortBy] = useState('Best match');
  const sortedJobs = [...filtered].sort((a, b) => {
    if (sortBy === 'Newest') {
      // Basic approximation of time parsing for "2h ago", "1d ago", "3d ago"
      const timeA = a.posted.includes('h') ? parseInt(a.posted) : parseInt(a.posted) * 24;
      const timeB = b.posted.includes('h') ? parseInt(b.posted) : parseInt(b.posted) * 24;
      return timeA - timeB;
    }
    return 0; // Best match
  });

  const [activeId, setActiveId] = useState<string>('');
  const j = sortedJobs.find(x => x.id === activeId) ?? sortedJobs[0];

  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [saved,   setSaved]   = useState<Set<string>>(new Set());
  const globalToast = useGlobalToast();

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string, isApply: boolean) => {
    const n = new Set(set);
    if (n.has(id)) {
      n.delete(id);
      globalToast.add(isApply ? 'Application withdrawn' : 'Removed from saved', 'info');
    } else {
      n.add(id);
      globalToast.add(isApply ? 'Application sent successfully!' : 'Saved to profile', 'success');
    }
    setter(n);
  };
  const isApplied = applied.has(j?.id);
  const isSaved   = saved.has(j?.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Jobs & Careers"
        marathi="नौकरी"
        subtitle={`${loading ? '...' : jobsData.length} open roles · curated for the Marathi diaspora · includes B2B partner roles`}
        actions={<>
          <Btn kind="ghost" size="md" iconL="spark" onClick={() => router.push('/career-simulator')}>Career quiz</Btn>
          <Btn kind="ghost" size="md" iconL="news" onClick={() => globalToast.add('Resume builder launching Q3 2026 — stay tuned!', 'info')}>Resume builder</Btn>
          <Btn kind="dark" size="md" iconL="plus" onClick={() => setPostJobOpen(true)}>Post a job</Btn>
        </>}
      />

      {/* Filter row */}
      <Card pad={14} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: C.bgDeep, borderRadius: 10 }}>
          <Icon name="search" size={16} color={C.ink3}/>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Designer, engineer, Marathi editor…" 
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit' }}
          />
        </div>
        <select value={activeLoc} onChange={e => setActiveLoc(e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.lineMid}`, borderRadius: 10, background: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          {locs.map(l => <option key={l}>{l}</option>)}
        </select>
        <select value={activeExp} onChange={e => setActiveExp(e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.lineMid}`, borderRadius: 10, background: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          <option>Any experience</option><option>0–2y</option><option>3–5y</option><option>6+y</option>
        </select>
        <Btn kind="primary" size="md" onClick={() => globalToast.add(`Showing ${filtered.length} jobs`, 'info')}>Search</Btn>
      </Card>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {cats.map(c => <Pill key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</Pill>)}
      </div>

      {/* List + detail */}
      {j ? (
        <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 16 }}>
          <Card pad={0}>
            <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.line}`, fontSize: 12, color: C.ink3, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Showing {sortedJobs.length} of {jobsData.length}</span>
              <span>Sort: <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ appearance: 'none', background: 'transparent', border: 'none', color: C.ink, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                <option value="Best match">Best match ▾</option>
                <option value="Newest">Newest ▾</option>
              </select></span>
            </div>
            {loading ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: C.ink3, fontSize: 13 }}>
                Loading jobs from iDempiere...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink }}>No {activeCat.toLowerCase()} roles right now</div>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: C.ink3 }}>Try a different category.</p>
              </div>
            ) : sortedJobs.map((job, i) => (
              <div key={job.id} onClick={() => setActiveId(job.id)} style={{
                display: 'grid', gridTemplateColumns: '46px 1fr', gap: 14, padding: '16px 18px',
                borderBottom: i < filtered.length - 1 ? `1px solid ${C.line}` : 'none',
                cursor: 'pointer',
                background: job.id === activeId ? C.surfaceAlt : '#fff',
                borderLeft: `3px solid ${job.id === activeId ? C.saffron : 'transparent'}`,
              }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: toneBg[job.tone], color: toneColor[job.tone], fontSize: 20, fontWeight: 700, fontFamily: F.display, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{job.logo}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{job.role}</span>
                    {applied.has(job.id) && <Tag color="#fff" bg={C.green}>Applied</Tag>}
                    {job.tag && !applied.has(job.id) && <Tag color="#fff" bg={job.tag === 'Match' ? C.green : C.brick}>{job.tag}</Tag>}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.ink3, marginTop: 2, fontWeight: 500 }}>{job.co} <span style={{ color: C.ink4 }}>·</span> {job.loc}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Tag color={C.ink2} bg={C.bgDeep}>{job.pay}</Tag>
                    <Tag color={C.ink2} bg={C.bgDeep}>{job.exp}</Tag>
                    <Tag color={C.ink2} bg={C.bgDeep}>{job.type}</Tag>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: C.ink3, fontWeight: 600 }}>
                    <span>Posted {job.posted}</span>
                    <span>{job.applicants + (applied.has(job.id) ? 1 : 0)} applicants</span>
                  </div>
                </div>
              </div>
            ))}
          </Card>

          {/* Detail panel */}
          <Card pad={0} style={{ position: 'sticky', top: 130, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
            <ImgPh kind="job" height={120} tone={j.tone}/>
            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, marginTop: -40, background: '#fff', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.saffronDk, fontSize: 26, fontWeight: 700, fontFamily: F.display, letterSpacing: '-0.025em', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>{j.logo}</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.2, color: C.ink }}>{j.role}</h2>
                  <div style={{ fontSize: 13.5, color: C.ink2, marginTop: 4, fontWeight: 600 }}>{j.co} · {j.loc}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                {([['Compensation', j.pay, 'money'],['Experience', j.exp, 'spark'],['Type', j.type, 'work'],['Posted', j.posted, 'clock']] as const).map(([k, v, ic], i) => (
                  <div key={i} style={{ background: C.bgDeep, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon name={ic} size={12} color={C.ink3}/> {k}
                    </div>
                    <div style={{ fontSize: 14, color: C.ink, fontWeight: 700, marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>

              <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: C.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>About the role</h4>
              <p style={{ margin: 0, fontSize: 13.5, color: C.ink2, fontWeight: 500, lineHeight: 1.55 }}>{j.desc || 'No description provided.'}</p>
              {j.detail && (
                <p style={{ margin: '8px 0 0', fontSize: 13.5, color: C.ink2, fontWeight: 500, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                  {j.detail.replace(/^'+|'+$/g, '')}
                </p>
              )}
              
              <h4 style={{ margin: '20px 0 8px', fontSize: 12, fontWeight: 700, color: C.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Requirements</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                {([['Education', j.education || '-', 'book'],['Additional', j.additionalEdu || '-', 'star']] as const).map(([k, v, ic], i) => (
                  <div key={i} style={{ background: C.bgDeep, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon name={ic} size={12} color={C.ink3}/> {k}
                    </div>
                    <div style={{ fontSize: 13, color: C.ink, fontWeight: 700, marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>

              <h4 style={{ margin: '20px 0 8px', fontSize: 12, fontWeight: 700, color: C.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Why through Connect2MCS</h4>
              <div style={{ background: C.greenLt, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <Icon name="verify" size={20} color={C.green}/>
                <div style={{ fontSize: 12.5, color: C.ink2, fontWeight: 600, lineHeight: 1.5 }}>
                  <strong>3 community members work here.</strong> Anuja Karandikar (BMM Pune) is a current employee and willing to refer.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
                <Btn
                  kind={isApplied ? 'soft' : 'primary'}
                  size="lg"
                  full
                  onClick={() => toggle(applied, setApplied, j.id, true)}
                >
                  {isApplied ? 'Application sent ✓' : 'Apply with Connect2MCS'}
                </Btn>
                <Btn
                  kind={isSaved ? 'soft' : 'outline'}
                  size="lg"
                  onClick={() => toggle(saved, setSaved, j.id, false)}
                >
                  <Icon name="heart" size={18} color={isSaved ? C.brick : C.ink}/>
                </Btn>
                <Btn kind="outline" size="lg" onClick={() => { if (navigator.share) navigator.share({ title: j.role, text: `${j.role} at ${j.co}`, url: window.location.href }); else { navigator.clipboard.writeText(window.location.href); globalToast.add('Link copied!', 'success'); } }}><Icon name="share" size={18}/></Btn>
              </div>
              <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>
                {isApplied
                  ? <>You'll hear back within 5–7 working days. <span style={{ color: C.saffronDk, fontWeight: 600, cursor: 'pointer' }}>Track in Profile</span>.</>
                  : <>{j.applicants} applicants · Top 25% match for your skills</>}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card pad={22}>
          <div style={{ textAlign: 'center', color: C.ink3, fontSize: 13, padding: 40 }}>
            No job selected.
          </div>
        </Card>
      )}
      <PostJobModal isOpen={postJobOpen} onClose={() => setPostJobOpen(false)}/>
    </div>
  );
}
