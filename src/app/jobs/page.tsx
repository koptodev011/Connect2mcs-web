'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, ImgPh, PageHeader, useGlobalToast } from '@/components/primitives';
import { Job } from '@/data/jobs';
import { toneBg, toneColor } from '@/lib/tones';
import { PostJobModal } from '@/components/FormModals';

const PAGE_SIZE = 10;

const cats = ['All', 'Contract', 'Full-time', 'Part-time', 'Volunteer'];
const locs = ['Anywhere', 'India', 'USA', 'UK', 'Remote'];

export default function JobsPage() {
  const [jobsData, setJobsData] = useState<Job[]>([]);
  const [jobStats, setJobStats] = useState({
    liveJobs: 0,
    countries: 0,
    applications: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [postJobOpen, setPostJobOpen] = useState(false);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/jobs/stats')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load jobs statistics');
        return response.json();
      })
      .then(data => {
        setJobStats({
          liveJobs: Number(data.liveJobs) || 0,
          countries: Number(data.countries) || 0,
          applications: Number(data.applications) || 0,
        });
      })
      .catch(error => console.error('Jobs statistics error:', error))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    fetch(`/api/data/jobs?top=${PAGE_SIZE}&skip=0`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobsData(data);
          setHasMore(data.length === PAGE_SIZE);
          if (data.length > 0) setActiveId(data[0].id);
        }
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/data/jobs?featured=true&top=5&skip=0')
      .then(response => response.ok ? response.json() : [])
      .then(data => setFeaturedJobs(Array.isArray(data) ? data : []))
      .catch(error => console.error('Featured jobs loading error:', error))
      .finally(() => setFeaturedLoading(false));
  }, []);

  const viewAllFeatured = async () => {
    try {
      setFeaturedLoading(true);
      const response = await fetch('/api/data/jobs?featured=true&top=50&skip=0');
      if (!response.ok) throw new Error('Failed to load featured jobs');
      const data = await response.json();
      setFeaturedJobs(Array.isArray(data) ? data : []);
      setShowAllFeatured(true);
    } catch (error) {
      console.error('Featured jobs loading error:', error);
      globalToast.add('Could not load featured opportunities', 'error');
    } finally {
      setFeaturedLoading(false);
    }
  };

  const loadMoreJobs = useCallback(async (skip: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    await Promise.resolve();
    setLoadingMore(true);

    try {
      const response = await fetch(`/api/data/jobs?top=${PAGE_SIZE}&skip=${skip}`);
      if (!response.ok) throw new Error('Failed to load more jobs');
      const data = await response.json();
      if (!Array.isArray(data)) return;

      setJobsData(current => [
        ...current,
        ...data.filter(job => !current.some(existing => existing.id === job.id)),
      ]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Jobs pagination error:', error);
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadMoreJobs(jobsData.length);
    }, { rootMargin: '300px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, jobsData.length, loadMoreJobs, loading, loadingMore]);

  const [activeCat, setActiveCat] = useState('All');
  const [activeLoc, setActiveLoc] = useState('Anywhere');
  const [activeExp, setActiveExp] = useState('Any experience');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filtered = jobsData.filter(j => {
    const matchCat = activeCat === 'All' || j.type.toLowerCase() === activeCat.toLowerCase();
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

  const j = sortedJobs.find(x => x.id === activeId) ?? sortedJobs[0];

  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [saved,   setSaved]   = useState<Set<string>>(new Set());
  const globalToast = useGlobalToast();
  useEffect(() => {
    let cancelled = false;

    try {
      const savedUser = localStorage.getItem('mcs_user');
      const token = localStorage.getItem('mcs_token');
      const user = savedUser ? JSON.parse(savedUser) : null;
      if (!user || user.isGuest || !token) return;

      fetch('/api/jobs/apply', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(response => response.ok ? response.json() : { jobIds: [] })
        .then(result => {
          if (!cancelled && Array.isArray(result.jobIds)) {
            setApplied(new Set(result.jobIds.map(String)));
          }
        })
        .catch(error => console.error('Applied jobs loading error:', error));
    } catch {
      // Invalid local session is handled when Apply is clicked.
    }

    return () => {
      cancelled = true;
    };
  }, []);


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
  const handlePostJob = async () => {
    try {
      const savedUser = localStorage.getItem('mcs_user');
      const user = savedUser ? JSON.parse(savedUser) : null;
      if (!user || user.isGuest) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/data/profile?username=${encodeURIComponent(user.name || user.email || '')}`);
      const profiles = response.ok ? await response.json() : [];
      const profile = Array.isArray(profiles) ? profiles[0] : null;
      const loginTypeValue = profile?.loginTypeId || profile?.type;
      const loginType = typeof loginTypeValue === 'object'
        ? String(loginTypeValue.id || loginTypeValue.identifier || '')
        : String(loginTypeValue || '');

      if (!['E', 'J'].includes(loginType.toUpperCase())) {
        globalToast.add('Only employers and job posters can post a job', 'error');
        return;
      }

      setPostJobOpen(true);
    } catch {
      globalToast.add('Could not verify job posting permission', 'error');
    }
  };

  const handleApply = async (job: Job) => {
    let user: { name?: string; email?: string; isGuest?: boolean } | null = null;
    try {
      const savedUser = localStorage.getItem('mcs_user');
      user = savedUser ? JSON.parse(savedUser) : null;
      if (!user || user.isGuest) {
        router.push('/login');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    if (applied.has(job.id)) {
      globalToast.add('Application already sent', 'info');
      return;
    }

    if (job.applyUrl) {
      try {
        const applyUrl = new URL(job.applyUrl, window.location.origin);
        if (!['http:', 'https:'].includes(applyUrl.protocol)) throw new Error();
        window.location.assign(applyUrl.toString());
        return;
      } catch {
        globalToast.add('Invalid job application URL', 'error');
        return;
      }
    }

    try {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mcs_token') || ''}`,
        },
        body: JSON.stringify({ jobId: job.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not submit job application');

      setApplied(current => new Set(current).add(job.id));
      globalToast.add('Application sent successfully!', 'success');
    } catch (error) {
      globalToast.add(error instanceof Error ? error.message : 'Could not submit job application', 'error');
    }
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
          {/* <Btn kind="ghost" size="md" iconL="spark" onClick={() => router.push('/career-simulator')}>Career quiz</Btn> */}
          <Btn kind="ghost" size="md" iconL="news" onClick={() => globalToast.add('Resume builder launching Q3 2026 — stay tuned!', 'info')}>Resume builder</Btn>
          <Btn kind="dark" size="md" iconL="plus" onClick={handlePostJob}>Post a job</Btn>
        </>}
      />

      {/* Jobs statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        {([
          ['Live Jobs', jobStats.liveJobs, C.saffron, C.saffronLt],
          ['Countries', jobStats.countries, C.blue, '#DCE5F4'],
          ['Applications', jobStats.applications, C.green, C.greenLt],
        ] as const).map(([label, value, color, background]) => (
          <Card key={label} pad={16} style={{ background, borderColor: `${color}30` }}>
            <div className="num" style={{ fontFamily: F.display, fontSize: 27, lineHeight: 1, fontWeight: 700, color }}>
              {statsLoading ? '...' : value.toLocaleString()}
            </div>
            <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {label}
            </div>
          </Card>
        ))}
      </div>

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
        {/* <select value={activeLoc} onChange={e => setActiveLoc(e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.lineMid}`, borderRadius: 10, background: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          {locs.map(l => <option key={l}>{l}</option>)}
        </select> */}
        <select value={activeExp} onChange={e => setActiveExp(e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.lineMid}`, borderRadius: 10, background: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          <option>Any experience</option><option>0–2y</option><option>3–5y</option><option>6+y</option>
        </select>
        <Btn kind="primary" size="md" onClick={() => globalToast.add(`Showing ${filtered.length} jobs`, 'info')}>Search</Btn>
      </Card>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {cats.map(c => <Pill key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</Pill>)}
      </div>

      {/* Featured Opportunities */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 21, fontWeight: 600, color: C.ink }}>Featured Opportunities</h2>
            <div style={{ marginTop: 3, fontSize: 12.5, color: C.ink3, fontWeight: 500 }}>Handpicked for NRIs</div>
          </div>
          {!showAllFeatured && featuredJobs.length === 5 && (
            <Btn kind="ghost" size="sm" onClick={viewAllFeatured}>View all</Btn>
          )}
        </div>

        {featuredLoading && featuredJobs.length === 0 ? (
          <Card style={{ textAlign: 'center', color: C.ink3, fontSize: 13 }}>Loading featured opportunities...</Card>
        ) : featuredJobs.length === 0 ? (
          <Card style={{ textAlign: 'center', color: C.ink3, fontSize: 13 }}>No featured opportunities available.</Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(205px, 240px))', gap: 12, justifyContent: 'start' }}>
            {featuredJobs.map(job => {
              const jobApplied = applied.has(job.id);
              return (
                <Card key={job.id} pad={14} style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 230, borderTop: `3px solid ${toneColor[job.tone]}` }}>
                  <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, background: toneBg[job.tone], color: toneColor[job.tone], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontSize: 17, fontWeight: 700 }}>
                      {job.logo}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{job.role}</div>
                      <div style={{ marginTop: 3, fontSize: 12, color: C.ink3, fontWeight: 600 }}>{job.co}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Tag color={C.ink2} bg={C.bgDeep}>{job.loc}</Tag>
                    <Tag color={C.ink2} bg={C.bgDeep}>{job.pay}</Tag>
                    <Tag color={C.ink2} bg={C.bgDeep}>{job.type}</Tag>
                    <Tag color={C.ink3} bg={C.bgDeep}>Posted {job.posted}</Tag>
                    <Tag color={C.saffronDk} bg={C.saffronLt}>Featured</Tag>
                  </div>
                  <div style={{ marginTop: 'auto' }}>
                    <Btn kind={jobApplied ? 'soft' : 'primary'} size="sm" full onClick={() => handleApply(job)}>
                      {jobApplied ? 'Application sent' : 'Apply now'}
                    </Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

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
            {hasMore && <div ref={loadMoreRef} aria-hidden="true" style={{ height: 1 }} />}
            {loadingMore && <div style={{ padding: '14px 18px', textAlign: 'center', color: C.ink3, fontSize: 12 }}>Loading more jobs...</div>}
          </Card>

          {/* Detail panel */}
          <Card pad={0} style={{ position: 'sticky', top: 130, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
            <ImgPh kind="job" height={120} tone={j.tone}/>
            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12,  background: '#fff', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.saffronDk, fontSize: 26, fontWeight: 700, fontFamily: F.display, letterSpacing: '-0.025em', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>{j.logo}</div>
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

              {/* <h4 style={{ margin: '20px 0 8px', fontSize: 12, fontWeight: 700, color: C.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Why through Connect2MCS</h4>
              <div style={{ background: C.greenLt, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <Icon name="verify" size={20} color={C.green}/>
                <div style={{ fontSize: 12.5, color: C.ink2, fontWeight: 600, lineHeight: 1.5 }}>
                  <strong>3 community members work here.</strong> Anuja Karandikar (BMM Pune) is a current employee and willing to refer.
                </div>
              </div> */}

              <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
                <Btn
                  kind={isApplied ? 'soft' : 'primary'}
                  size="lg"
                  full
                  onClick={() => handleApply(j)}
                >
                  {isApplied ? 'Application sent ✓' : 'Apply with Connect2MCS'}
                </Btn>
                {/* <Btn
                  kind={isSaved ? 'soft' : 'outline'}
                  size="lg"
                  onClick={() => toggle(saved, setSaved, j.id, false)}
                >
                  <Icon name="heart" size={18} color={isSaved ? C.brick : C.ink}/>
                </Btn>
                <Btn kind="outline" size="lg" onClick={() => { if (navigator.share) navigator.share({ title: j.role, text: `${j.role} at ${j.co}`, url: window.location.href }); else { navigator.clipboard.writeText(window.location.href); globalToast.add('Link copied!', 'success'); } }}><Icon name="share" size={18}/></Btn> */}
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
