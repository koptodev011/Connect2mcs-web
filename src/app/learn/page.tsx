'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { Btn, Card, Tag, ImgPh, SectionHead, PageHeader, Stat } from '@/components/primitives';
import { FilterModal, ApplyModal, PostJobModal } from '@/components/FormModals';
import { ApplicantProfile, JobApplicationModal } from '@/components/JobApplicationModal/JobApplicationModal';
import type { Scholarship, Internship } from '@/data/learn';
import styles from './page.module.css';

type Tab = 'scholarships' | 'internships';

const PAGE_SIZE = 6;

export default function LearnPage() {
  const [scholarshipsData, setScholarshipsData] = useState<Scholarship[]>([]);
  const [internshipsData, setInternshipsData] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [postOpportunityOpen, setPostOpportunityOpen] = useState(false);
  const [applicationInternship, setApplicationInternship] = useState<Internship | null>(null);
  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfile>({ name: '', email: '', phone: '' });
  const [applyTarget, setApplyTarget] = useState<{ id: string; type: 'scholarship' | 'internship'; name: string } | null>(null);
  const [tab, setTab] = useState<Tab>('scholarships');
  const [sortSchBy, setSortSchBy] = useState('Deadline');
  const [sortIntBy, setSortIntBy] = useState('Newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSch, setAppliedSch] = useState<Set<string>>(new Set(['pmet']));
  const [appliedInt, setAppliedInt] = useState<Set<string>>(new Set());
  const [visibleScholarships, setVisibleScholarships] = useState(PAGE_SIZE);
  const [visibleInternships, setVisibleInternships] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch('/api/data/scholarships').then(res => res.json()),
      fetch('/api/data/internships').then(res => res.json()),
    ])
      .then(([sData, iData]) => {
        setScholarshipsData(Array.isArray(sData) ? sData : []);
        setInternshipsData(Array.isArray(iData) ? iData : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredScholarships = scholarshipsData.filter(item =>
    [item.title, item.org, item.amount, item.field, item.deadline, item.criteria]
      .some(value => String(value || '').toLowerCase().includes(normalizedQuery))
  );
  const filteredInternships = internshipsData.filter(item =>
    [item.role, item.co, item.loc, item.stipend, item.dur, item.when]
      .some(value => String(value || '').toLowerCase().includes(normalizedQuery))
  );


  const loadMore = useCallback(() => {
    if (tab === 'scholarships') {
      setVisibleScholarships(count => Math.min(count + PAGE_SIZE, filteredScholarships.length));
    } else {
      setVisibleInternships(count => Math.min(count + PAGE_SIZE, filteredInternships.length));
    }
  }, [tab, filteredScholarships.length, filteredInternships.length]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: '240px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const visibleItems = tab === 'scholarships' ? visibleScholarships : visibleInternships;
  const totalItems = tab === 'scholarships' ? filteredScholarships.length : filteredInternships.length;
  const scholarshipAmounts = scholarshipsData
    .map(scholarship => Number(String(scholarship.amount).replace(/[^0-9.-]/g, '')))
    .filter(amount => Number.isFinite(amount));
  const averageAward = scholarshipAmounts.length
    ? scholarshipAmounts.reduce((total, amount) => total + amount, 0) / scholarshipAmounts.length
    : 0;
  const formattedAverageAward = loading
    ? '-'
    : averageAward >= 1000
      ? '$' + (averageAward / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
      : '$' + Math.round(averageAward).toLocaleString('en-US');

  const handleApply = async (target: { id: string; type: 'scholarship' | 'internship'; name: string; applyUrl?: string }) => {
    if (target.applyUrl?.trim()) {
      try {
        const applyUrl = new URL(target.applyUrl, window.location.origin);
        if (!['http:', 'https:'].includes(applyUrl.protocol)) throw new Error();
        window.location.assign(applyUrl.toString());
      } catch {
        console.error('Invalid internship application URL');
      }
      return;
    }
    if (target.type === 'scholarship') return;

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
      const internship = internshipsData.find(item => item.id === target.id);
      if (!internship) throw new Error('Internship was not found');
      setApplicationInternship(internship);
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Learn & Earn"
        marathi="शिक्षण"
        subtitle={`${loading ? '...' : scholarshipsData.length} scholarships · ${loading ? '...' : internshipsData.length} internships · curated for Marathi students worldwide`}
        actions={tab === 'internships' ? (
          <Btn kind="dark" size="md" iconL="plus" onClick={() => setPostOpportunityOpen(true)}>Post opportunity</Btn>
        ) : undefined}
      />

      <div className={styles.tabs}>
        {(['scholarships', 'internships'] as Tab[]).map(item => (
          <button key={item} onClick={() => { setTab(item); setVisibleScholarships(PAGE_SIZE); setVisibleInternships(PAGE_SIZE); }} className={`${styles.tab} ${tab === item ? styles.activeTab : 'nav-int'}`}>
            {item === 'scholarships' ? `Scholarships · ${loading ? '...' : scholarshipsData.length}` : `Internships · ${loading ? '...' : internshipsData.length}`}
          </button>
        ))}
      </div>

      <div className={styles.searchWrap}>
        <Icon name="search" size={18} color="#6B6256"/>
        <input
          type="search"
          value={searchQuery}
          onChange={event => { setSearchQuery(event.target.value); setVisibleScholarships(PAGE_SIZE); setVisibleInternships(PAGE_SIZE); }}
          placeholder={tab === 'scholarships' ? 'Search scholarships, fields, organizations...' : 'Search internships, companies, locations...'}
          aria-label={`Search ${tab}`}
          className={styles.searchInput}
        />
        {searchQuery && <button type="button" className={styles.clearSearch} onClick={() => { setSearchQuery(''); setVisibleScholarships(PAGE_SIZE); setVisibleInternships(PAGE_SIZE); }} aria-label="Clear search">Ãƒâ€”</button>}
      </div>

      <div className={`${styles.stats} mob-2col`}>
        {[
          { v: loading ? '-' : String(scholarshipsData.length), l: 'OPEN SCHOLARSHIPS', h: 'Worldwide' },
          { v: loading ? '-' : String(internshipsData.length), l: 'OPEN INTERNSHIPS', h: 'Various stipends' },
          { v: loading ? '-' : String(appliedSch.size + appliedInt.size), l: 'YOUR APPLICATIONS', h: 'Currently active' },
          { v: formattedAverageAward, l: 'AVG. AWARD', h: 'Across current scholarships' },
        ].map((stat, index) => <Card key={index} pad={20}><Stat value={stat.v} label={stat.l} hint={stat.h}/></Card>)}
      </div>

      {!loading && <UpcomingDeadlines scholarships={scholarshipsData} internships={internshipsData} onApply={handleApply} />}

      <Card pad={0}>
        <div className={styles.cardHeader}>
          <div><div className={styles.cardTitle}>Your applications</div><div className={styles.cardSubtitle}>Track status across scholarships and internships</div></div>
          <Btn kind="ghost" size="sm">View all</Btn>
        </div>
        {loading ? <div className={styles.message}>Loading your applications...</div> : [
          ...Array.from(appliedSch).map(id => { const item = scholarshipsData.find(x => x.id === id); return item ? { item: item.org, kind: 'Scholarship', when: 'Submitted today' } : null; }).filter(Boolean),
          ...Array.from(appliedInt).map(id => { const item = internshipsData.find(x => x.id === id); return item ? { item: item.co, kind: 'Internship', when: 'Submitted today' } : null; }).filter(Boolean),
        ].map((application, index, applications) => application && (
          <div key={index} className={`${styles.applicationRow} ${index < applications.length - 1 ? styles.withBorder : ''}`}>
            <div><div className={styles.applicationName}>{application.item}</div><div className={styles.applicationKind}>{application.kind}</div></div>
            <span className={styles.pendingStatus}>Ã¢â€”Â Pending review</span><span className={styles.applicationWhen}>{application.when}</span><Btn kind="outline" size="sm">View</Btn>
          </div>
        ))}
      </Card>

      {tab === 'scholarships' ? (
        <section>
          <SectionHead title="Open scholarships" subtitle="Filtered by your eligibility" action={<select value={sortSchBy} onChange={event => setSortSchBy(event.target.value)} className={styles.sort}><option value="Deadline">Sort: Deadline</option><option value="Amount">Sort: Amount</option></select>}/>
          <div className={`${styles.scholarshipGrid} mob-stack`}>
            {loading ? <div className={styles.gridMessage}>Loading scholarships...</div> : filteredScholarships.length === 0 ? <div className={styles.gridMessage}>No scholarships match your search.</div> : filteredScholarships.slice(0, visibleScholarships).map((scholarship, index) => {
              const isApplied = appliedSch.has(scholarship.id);
              return (
                <Card key={`${scholarship.id}-${index}`} pad={0} interactive className={`${styles.scholarshipCard} mob-stack`} onClick={() => router.push(`/learn/${scholarship.id}`)}>
                  <div className={styles.scholarshipImage}><ImgPh kind="scholarship" tone={scholarship.tone} height="100%"/></div>
                  <div className={styles.scholarshipBody}>
                    <div className={styles.scholarshipTop}><div><h4 className={styles.scholarshipTitle}>{scholarship.title}</h4><div className={styles.mutedLine}>{scholarship.org}</div></div>{scholarship.eligible ? <Tag color="#1F7A3A" bg="#E1F2E6">● Eligible</Tag> : <Tag color="#6B6256" bg="#F2EBD8">Check criteria</Tag>}</div>
                    <div className={`${styles.amount} num`}>{scholarship.amount}</div>
                    <div className={styles.criteria}>{scholarship.field}{scholarship.criteria && <><br/><span>{scholarship.criteria}</span></>}</div>
                    <div className={styles.scholarshipFooter}><span className={styles.deadline}><Icon name="clock" size={13} color="#6B6256"/> Deadline {scholarship.deadline}</span><Btn kind={isApplied ? 'soft' : scholarship.eligible ? 'primary' : 'outline'} size="sm" onClick={event => { event.stopPropagation(); if (!isApplied) handleApply({ id: scholarship.id, type: 'scholarship', name: scholarship.title, applyUrl: scholarship.applyUrl }); }}>{isApplied ? 'Applied ✓' : 'Apply'}</Btn></div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ) : (
        <section>
          <SectionHead title="Open internships" subtitle="Curated picks · summer & fall cycles" action={<select value={sortIntBy} onChange={event => setSortIntBy(event.target.value)} className={styles.sort}><option value="Newest">Sort: Newest</option><option value="Closing soon">Sort: Closing soon</option></select>}/>
          <Card pad={0}>
            {loading ? <div className={styles.messageCentered}>Loading internships...</div> : filteredInternships.length === 0 ? <div className={styles.messageCentered}>{searchQuery ? 'No internships match your search.' : 'No internships found.'}</div> : filteredInternships.slice(0, visibleInternships).map((internship, index) => {
              const isApplied = appliedInt.has(internship.id);
              return (
                <div key={`${internship.id}-${index}`} className={`${styles.internshipRow} ${index < Math.min(visibleInternships, filteredInternships.length) - 1 ? styles.withBorder : ''} mob-stack btn-int`} onClick={() => router.push(`/learn/${internship.id}`)}>
                  <div className={`${styles.logo} ${styles[`tone_${internship.tone}`]}`}>{internship.logo}</div>
                  <div className={styles.internshipInfo}><div className={styles.roleLine}><span className={styles.role}>{internship.role}</span><Tag color="#1F7A3A" bg="#E1F2E6">{isApplied ? 'Applied' : 'Open'}</Tag></div><div className={styles.company}>{internship.co} <span>Â·</span> {internship.loc}</div><div className={styles.tags}><Tag>{internship.stipend}</Tag><Tag>{internship.dur}</Tag><Tag>{internship.when}</Tag></div></div>
                  <div className={styles.applyBy}><div>Apply by</div><strong>20 May 2026</strong></div>
                  <Btn kind={isApplied ? 'soft' : 'primary'} size="sm" onClick={event => { event.stopPropagation(); if (!isApplied) handleApply({ id: internship.id, type: 'internship', name: internship.role, applyUrl: internship.applyUrl }); }}>{isApplied ? 'Applied ✓' : 'Apply'}</Btn>
                </div>
              );
            })}
          </Card>
        </section>
      )}

      {!loading && visibleItems < totalItems && <div ref={loadMoreRef} className={styles.loadMore} aria-label="Loading more opportunities"><span/></div>}

      <FilterModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
      <PostJobModal isOpen={postOpportunityOpen} onClose={() => setPostOpportunityOpen(false)} MCS_Type="I" />
      {applicationInternship && (
        <JobApplicationModal
          isOpen
          job={applicationInternship}
          initialProfile={applicantProfile}
          applicationType="internship"
          onClose={() => setApplicationInternship(null)}
          onSubmitted={internshipId => setAppliedInt(current => new Set(current).add(internshipId))}
        />
      )}
      {applyTarget && <ApplyModal isOpen onClose={() => setApplyTarget(null)} itemName={applyTarget.name} onSubmit={() => { if (applyTarget.type === 'scholarship') setAppliedSch(current => new Set(current).add(applyTarget.id)); else setAppliedInt(current => new Set(current).add(applyTarget.id)); }}/>}
    </div>
  );
}

function UpcomingDeadlines({ scholarships, internships, onApply }: { scholarships: Scholarship[]; internships: Internship[]; onApply: (target: { id: string; type: 'scholarship' | 'internship'; name: string; applyUrl?: string }) => void }) {
  const urgentThreshold = 30;
  const getDaysLeft = (value: string) => 10 + Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0) % 60;
  const combined = [
    ...scholarships.map(item => ({ id: item.id, kind: 'Scholarship', title: item.title, org: item.org, amount: item.amount, date: item.deadline, tone: item.tone, eligible: item.eligible, applyUrl: item.applyUrl, daysLeft: getDaysLeft(item.id) })),
    ...internships.map(item => ({ id: item.id, kind: 'Internship', title: item.role, org: item.co, amount: item.stipend, date: item.when, tone: item.tone, eligible: true, applyUrl: item.applyUrl, daysLeft: getDaysLeft(item.id) })),
  ].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5);

  return (
    <Card pad={0}>
      <div className={styles.cardHeader}><div><div className={styles.deadlinesTitle}>Upcoming deadlines </div><div className={styles.cardSubtitle}>Scholarships and internships closing soon</div></div></div>
      <div className={styles.deadlinesScroll}><div className={styles.deadlinesRow}>{combined.map((deadline, index) => {
        const isUrgent = deadline.daysLeft <= urgentThreshold;
        return <div key={index} className={`${styles.deadlineCard} ${isUrgent ? styles.urgentCard : ''} ${index < combined.length - 1 ? styles.deadlineBorder : ''}`}><div className={styles.deadlineBadges}><span className={isUrgent ? styles.urgentBadge : styles.daysBadge}>{isUrgent && 'Ã¢Å¡Â  '}{deadline.daysLeft} days left</span><span className={`${styles.kindBadge} ${styles[`tone_${deadline.tone}`]}`}>{deadline.kind}</span></div><div className={styles.deadlineTitle}>{deadline.title}</div><div className={styles.deadlineOrg}>{deadline.org}</div><div className={styles.deadlineMeta}><span className={styles[`toneText_${deadline.tone}`]}>{deadline.amount}</span><small>Due {deadline.date}</small></div><Btn kind={deadline.eligible ? 'primary' : 'outline'} size="sm" full onClick={() => onApply({ id: deadline.id, type: deadline.kind === 'Scholarship' ? 'scholarship' : 'internship', name: deadline.title, applyUrl: deadline.applyUrl })}>{deadline.eligible ? 'Apply now' : 'Check eligibility'}</Btn></div>;
      })}</div></div>
    </Card>
  );
}
