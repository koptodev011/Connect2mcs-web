'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { C } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, ImgPh, PageHeader, useGlobalToast } from '@/components/primitives';
import { Job } from '@/data/jobs';
import { PostJobModal } from '@/components/FormModals';
import { ResumeBuilderModal } from '@/components/ResumeBuilderModal';
import { ApplicantProfile, JobApplicationModal } from '@/components/JobApplicationModal/JobApplicationModal';
import './jobs.css';

const PAGE_SIZE = 10;

const cats = ['All', 'Contract', 'Full-time', 'Part-time', 'Volunteer'];
const locs = ['Anywhere', 'India', 'USA', 'UK', 'Remote'];
const toneClass = (tone: string) => `jobs-tone jobs-tone--${tone}`;

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
  const [resumeBuilderOpen, setResumeBuilderOpen] = useState(false);
  const [applicationJob, setApplicationJob] = useState<Job | null>(null);
  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfile>({ name: '', email: '', phone: '' });
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

  const handleDetailApply = async (job: Job) => {
    if (!job.applyUrl?.trim()) {
      try {
        const savedUser = JSON.parse(localStorage.getItem('mcs_user') || 'null');
        const token = localStorage.getItem('mcs_token');
        if (!savedUser || savedUser.isGuest || !token) {
          router.push('/login');
          return;
        }
        const response = await fetch(`/api/v1/models/ad_user/${encodeURIComponent(String(savedUser.id))}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Could not load user profile');
        const user = await response.json();
        setApplicantProfile({
          name: String(user.Name || user.name || ''),
          email: String(user.EMail || user.email || ''),
          phone: String(user.Phone2 || user.phone2 || ''),
        });
        setApplicationJob(job);
      } catch {
        router.push('/login');
      }
      return;
    }

    try {
      const applyUrl = new URL(job.applyUrl, window.location.origin);
      if (!['http:', 'https:'].includes(applyUrl.protocol)) throw new Error();
      window.location.assign(applyUrl.toString());
    } catch {
      globalToast.add('Invalid job application URL', 'error');
    }
  };
  const isApplied = applied.has(j?.id);
  const isSaved   = saved.has(j?.id);

  return (
    <div className="jobsStyle1">
      <PageHeader
        title="Jobs & Careers"        marathi="नौकरी"        subtitle={`${loading ? '...' : jobsData.length} open roles · curated for the Marathi diaspora · includes B2B partner roles`}
        actions={<>
          <Btn kind="ghost" size="md" iconL="spark" onClick={() => router.push('/career-simulator')}>Career Simulator</Btn>
          <Btn kind="ghost" size="md" iconL="news" onClick={() => setResumeBuilderOpen(true)}>Resume builder</Btn>
          <Btn kind="dark" size="md" iconL="plus" onClick={handlePostJob}>Post a job</Btn>
        </>}
      />

      {/* Jobs statistics */}
      <div className="jobsStyle2">
        {([
          ['Live Jobs', jobStats.liveJobs],
          ['Countries', jobStats.countries],
          ['Applications', jobStats.applications],
        ] as const).map(([label, value]) => (
          <Card key={label} pad={16} className={`jobs-stat jobs-stat--${label.toLowerCase().replace(' ', '-')}`}>
            <div className="num jobs-stat__value">
              {statsLoading ? '...' : value.toLocaleString()}
            </div>
            <div className="jobsStyle3">
              {label}
            </div>
          </Card>
        ))}
      </div>

      {/* Filter row */}
      <Card pad={14} className="jobsStyle4">
        <div className="jobsStyle5">
          <Icon name="search" size={16} color={C.ink3}/>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}            placeholder="Designer, engineer, Marathi editor…"
            className="jobsStyle6"
          />
        </div>
        {/* <select value={activeLoc} onChange={e => setActiveLoc(e.target.value)} className="jobsStyle7">
          {locs.map(l => <option key={l}>{l}</option>)}
        </select> */}
        <select value={activeExp} onChange={e => setActiveExp(e.target.value)} className="jobsStyle8">          <option>Any experience</option><option>0–2y</option><option>3–5y</option><option>6+y</option>
        </select>
        <Btn kind="primary" size="md" onClick={() => globalToast.add(`Showing ${filtered.length} jobs`, 'info')}>Search</Btn>
      </Card>

      <div className="jobsStyle9">
        {cats.map(c => <Pill key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</Pill>)}
      </div>

      {/* Featured Opportunities */}
      <section>
        <div className="jobsStyle10">
          <div>
            <h2 className="jobsStyle11">Featured Opportunities</h2>
            <div className="jobsStyle12">Handpicked for NRIs</div>
          </div>
          {!showAllFeatured && featuredJobs.length === 5 && (
            <Btn kind="ghost" size="sm" onClick={viewAllFeatured}>View all</Btn>
          )}
        </div>

        {featuredLoading && featuredJobs.length === 0 ? (
          <Card className="jobsStyle13">Loading featured opportunities...</Card>
        ) : featuredJobs.length === 0 ? (
          <Card className="jobsStyle14">No featured opportunities available.</Card>
        ) : (
          <div className="jobsStyle15">
            {featuredJobs.map(job => {
              const jobApplied = applied.has(job.id);
              return (
                <Card key={job.id} pad={14} className={`jobs-featured-card ${toneClass(job.tone)}`}>
                  <div className="jobsStyle16">
                    <div className={`jobs-featured-logo ${toneClass(job.tone)}`}>
                      {job.logo}
                    </div>
                    <div className="jobsStyle17">
                      <div className="jobsStyle18">{job.role}</div>
                      <div className="jobsStyle19">{job.co}</div>
                    </div>
                  </div>
                  <div className="jobsStyle20">
                    <Tag color={C.ink2} bg={C.bgDeep}>{job.loc}</Tag>
                    <Tag color={C.ink2} bg={C.bgDeep}>{job.pay}</Tag>
                    <Tag color={C.ink2} bg={C.bgDeep}>{job.type}</Tag>
                    <Tag color={C.ink3} bg={C.bgDeep}>Posted {job.posted}</Tag>
                    <Tag color={C.saffronDk} bg={C.saffronLt}>Featured</Tag>
                  </div>
                  <div className="jobsStyle21">
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
        <div className="mob-stack jobsStyle22" >
          <Card pad={0}>
            <div className="jobsStyle23">
              <span>Showing {sortedJobs.length} of {jobsData.length}</span>
              <span>Sort: <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="jobsStyle24">                <option value="Best match">Best match ▾</option>                <option value="Newest">Newest ▾</option>
              </select></span>
            </div>
            {loading ? (
              <div className="jobsStyle25">
                Loading jobs from iDempiere...
              </div>
            ) : filtered.length === 0 ? (
              <div className="jobsStyle26">
                <div className="jobsStyle27">No {activeCat.toLowerCase()} roles right now</div>
                <p className="jobsStyle28">Try a different category.</p>
              </div>
            ) : sortedJobs.map((job, i) => (
              <div key={job.id} onClick={() => setActiveId(job.id)} className={`jobs-list-item${job.id === activeId ? ' jobs-list-item--active' : ''}${i === sortedJobs.length - 1 ? ' jobs-list-item--last' : ''}`}>
                <div className={`jobs-list-logo ${toneClass(job.tone)}`}>{job.logo}</div>
                <div className="jobsStyle29">
                  <div className="jobsStyle30">
                    <span className="jobsStyle31">{job.role}</span>
                    {applied.has(job.id) && <Tag color="#fff" bg={C.green}>Applied</Tag>}
                    {job.tag && !applied.has(job.id) && <Tag color="#fff" bg={job.tag === 'Match' ? C.green : C.brick}>{job.tag}</Tag>}
                  </div>                  <div className="jobsStyle32">{job.co} <span className="jobsStyle33">·</span> {job.loc}</div>
                  <div className="jobsStyle34">
                    <Tag color={C.ink2} bg={C.bgDeep}>{job.pay}</Tag>
                    <Tag color={C.ink2} bg={C.bgDeep}>{job.exp}</Tag>
                    <Tag color={C.ink2} bg={C.bgDeep}>{job.type}</Tag>
                  </div>
                  <div className="jobsStyle35">
                    <span>Posted {job.posted}</span>
                    <span>{job.applicants + (applied.has(job.id) ? 1 : 0)} applicants</span>
                  </div>
                </div>
              </div>
            ))}
            {hasMore && <div ref={loadMoreRef} aria-hidden="true" className="jobsStyle36" />}
            {loadingMore && <div className="jobsStyle37">Loading more jobs...</div>}
          </Card>

          {/* Detail panel */}
          <Card pad={0} className="jobsStyle38">
            <ImgPh kind="job" height={120} tone={j.tone}/>
            <div className="jobsStyle39">
              <div className="jobsStyle40">
                <div className="jobsStyle41">{j.logo}</div>
                <div className="jobsStyle42">
                  <h2 className="jobsStyle43">{j.role}</h2>                  <div className="jobsStyle44">{j.co} · {j.loc}</div>
                </div>
              </div>

              <div className="jobsStyle45">
                {([['Compensation', j.pay, 'money'],['Experience', j.exp, 'spark'],['Type', j.type, 'work'],['Posted', j.posted, 'clock']] as const).map(([k, v, ic], i) => (
                  <div key={i} className="jobsStyle46">
                    <div className="jobsStyle47">
                      <Icon name={ic} size={12} color={C.ink3}/> {k}
                    </div>
                    <div className="jobsStyle48">{v}</div>
                  </div>
                ))}
              </div>

              <h4 className="jobsStyle49">About the role</h4>
              <p className="jobsStyle50">{j.desc || 'No description provided.'}</p>
              {j.detail && (
                <p className="jobsStyle51">
                  {j.detail.replace(/^'+|'+$/g, '')}
                </p>
              )}

              <h4 className="jobsStyle52">Requirements</h4>
              <div className="jobsStyle53">
                {([['Education', j.education || '-', 'book'],['Additional', j.additionalEdu || '-', 'star']] as const).map(([k, v, ic], i) => (
                  <div key={i} className="jobsStyle54">
                    <div className="jobsStyle55">
                      <Icon name={ic} size={12} color={C.ink3}/> {k}
                    </div>
                    <div className="jobsStyle56">{v}</div>
                  </div>
                ))}
              </div>

              {/* <h4 className="jobsStyle57">Why through Connect2MCS</h4>
              <div className="jobsStyle58">
                <Icon name="verify" size={20} color={C.green}/>
                <div className="jobsStyle59">
                  <strong>3 community members work here.</strong> Anuja Karandikar (BMM Pune) is a current employee and willing to refer.
                </div>
              </div> */}

              <div className="jobsStyle60">
                <Btn
                  kind={isApplied ? 'soft' : 'primary'}
                  size="lg"
                  full
                  onClick={() => handleDetailApply(j)}
                >                  {isApplied ? 'Application sent ✓' : 'Apply with Connect2MCS'}
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
              <div className="jobsStyle61">
                {isApplied
                  ? <>You&apos;ll hear back within 5–7 working days. <span className="jobsStyle62">Track in Profile</span>.</>
                  : <>{j.applicants} applicants · Top 25% match for your skills</>}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card pad={22}>
          <div className="jobsStyle63">
            No job selected.
          </div>
        </Card>
      )}
      {applicationJob && (
        <JobApplicationModal
          isOpen
          job={applicationJob}
          initialProfile={applicantProfile}
          onClose={() => setApplicationJob(null)}
          onSubmitted={jobId => setApplied(current => new Set(current).add(jobId))}
        />
      )}
      <PostJobModal isOpen={postJobOpen} onClose={() => setPostJobOpen(false)}/>
      <ResumeBuilderModal isOpen={resumeBuilderOpen} onClose={() => setResumeBuilderOpen(false)}/>
    </div>
  );
}
