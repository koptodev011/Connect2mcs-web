'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  HandCoins,
  HeartHandshake,
  IndianRupee,
  Landmark,
  Lightbulb,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ResumeBuilderModal } from '@/components/ResumeBuilderModal';
import { useLocation } from '@/components/LocationContext';
import { useGlobalToast } from '@/components/primitives';
import type { Mentor } from '@/data/mentorship';
import styles from './RoleDashboard.module.css';

type DashboardKind = 'student' | 'entrepreneur';
type IconType = typeof Users;


const studentStatDefinitions = [
  { key: 'connections', label: 'Connections', icon: Users },
  { key: 'mentors', label: 'Mentors', icon: HeartHandshake },
  { key: 'internships', label: 'Internships', icon: BriefcaseBusiness },
  { key: 'communities', label: 'Communities', icon: Building2 },
] as const;

type StudentStatKey = (typeof studentStatDefinitions)[number]['key'];
type StudentStatValues = Record<StudentStatKey, number | null>;

const initialStudentStats: StudentStatValues = {
  connections: null,
  mentors: null,
  internships: null,
  communities: null,
};

type DashboardOffer = { id: string; title: string; description: string; savings: string };
type DashboardOfferRecord = {
  id: string | number;
  IsActive?: boolean;
  Name?: string;
  Description?: string;
  MCS_description?: string;
  MCS_Savings?: number;
  C_BPartner_ID?: { identifier?: string };
  C_Country_ID?: { id?: string | number } | string | number;
  MCS_Offers_Category_ID?: { identifier?: string };
};
type DashboardJob = { id: string; role: string; co: string; loc: string; exp: string; pay: string; logo: string };
type DashboardDeadline = { id: string; title: string; date: Date; kind: 'Scholarship' | 'Internship' };
type DashboardHelpline = { id: string; title: string; phone: string };
type DashboardGroup = { id: string; name: string; members: string[]; posts?: string | number };
type EntrepreneurBusiness = { id: string; name: string };
type EntrepreneurService = { kind: string; id: number; title: string; subtitle: string; meta: string[] };
type EntrepreneurRequest = { id: string; kind: string; title: string; detail: string; customer: string; href: string };

const journey = [
  { title: 'Mentorship Program', meta: 'Batch 2025', tone: 'orange', progress: 'Explore', image: '/images/learn/mentorship-hub.png', href: '/mentorship' },
  { title: 'Internship Bootcamp', meta: 'Career readiness', tone: 'red', progress: '60% complete', image: '/images/learn/internship-hub.png', href: '/learn?tab=internships' },
  { title: 'Scholarship Finder', meta: 'For students', tone: 'green', progress: 'Explore', image: '/images/learn/scholorship-hub.png', href: '/learn?tab=scholarships' },
  { title: 'Resume Builder Pro', meta: 'Stand out', tone: 'violet', progress: '30% complete', image: '/images/learn/studenthome.jpg', action: 'resume' },
];

const quickLinks: Array<{ label: string; href: string; icon: IconType }> = [
  { label: 'Mandals', href: '/mandals', icon: Building2 },
  { label: 'Events', href: '/events', icon: CalendarDays },
  { label: 'Culture', href: '/culture', icon: Landmark },
  { label: 'Embassy', href: '/embassy', icon: BadgeCheck },
  { label: 'Housing', href: '/housing', icon: Building2 },
  { label: 'Jobs', href: '/jobs', icon: BriefcaseBusiness },
  { label: 'Buy & Sell', href: '/marketplace', icon: Store },
  { label: 'Businesses', href: '/businesses', icon: Building2 },
  { label: 'MCS Offers', href: '/offers', icon: HandCoins },
  { label: 'News', href: '/news', icon: FileText },
];




function SectionTitle({ title, action = 'View all', href }: { title: string; action?: string | null; href?: string }) {
  return (
    <div className={styles.sectionTitle}>
      <h2>{title}</h2>
      {action && (href ? <Link href={href}>{action} <ArrowRight size={14} /></Link> : <button type="button">{action} <ArrowRight size={14} /></button>)}
    </div>
  );
}

function StudentDashboard() {
  const { location } = useLocation();
  const router = useRouter();
  const toast = useGlobalToast();
  const [firstName, setFirstName] = useState('Guest');
  const [resumeBuilderOpen, setResumeBuilderOpen] = useState(false);
  const [studentStatValues, setStudentStatValues] = useState<StudentStatValues>(initialStudentStats);
  const [dashboardOffers, setDashboardOffers] = useState<DashboardOffer[] | null>(null);
  const [featuredJobs, setFeaturedJobs] = useState<DashboardJob[] | null>(null);
  const [topMentors, setTopMentors] = useState<Mentor[] | null>(null);
  const [acceptedMentorIds, setAcceptedMentorIds] = useState<Set<string>>(new Set());
  const [requestedMentorIds, setRequestedMentorIds] = useState<Set<string>>(new Set());
  const [connectingMentorId, setConnectingMentorId] = useState<string | null>(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DashboardDeadline[] | null>(null);
  const [helplines, setHelplines] = useState<DashboardHelpline[] | null>(null);
  const [trendingGroups, setTrendingGroups] = useState<DashboardGroup[] | null>(null);

  useEffect(() => {
    function loadUser() {
      const saved = localStorage.getItem('mcs_user');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          setFirstName(user?.name ? user.name.split(' ')[0] : 'Guest');
        } catch {
          setFirstName('Guest');
        }
      } else {
        setFirstName('Guest');
      }
    }
    loadUser();
    window.addEventListener('mcs_auth_change', loadUser);
    return () => window.removeEventListener('mcs_auth_change', loadUser);
  }, []);

  useEffect(() => {
    let active = true;

    const loadCount = async (model: string) => {
      const response = await fetch(`/api/data/${model}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to load ${model}`);
      const data = await response.json();
      return Array.isArray(data) ? data.length : 0;
    };

    Promise.allSettled([
      loadCount('mentors'),
      loadCount('internships'),
      loadCount('mandals'),
    ]).then(([mentors, internships, communities]) => {
      if (!active) return;
      setStudentStatValues((current) => ({
        ...current,
        mentors: mentors.status === 'fulfilled' ? mentors.value : 0,
        internships: internships.status === 'fulfilled' ? internships.value : 0,
        communities: communities.status === 'fulfilled' ? communities.value : 0,
      }));
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/v1/models/MCS_Offers?top=100&skip=0', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Failed to load offers')))
      .then((data: DashboardOfferRecord[] | { records?: DashboardOfferRecord[] }) => {
        const records = Array.isArray(data) ? data : data.records || [];
        const selectedCountryId = String(location.countryId || '');
        const offers = records
          .filter((offer) => offer.IsActive !== false)
          .filter((offer) => {
            const offerCountryId = typeof offer.C_Country_ID === 'object' ? offer.C_Country_ID?.id : offer.C_Country_ID;
            return !selectedCountryId || String(offerCountryId || '') === selectedCountryId;
          })
          .slice(0, 3)
          .map((offer): DashboardOffer => ({
            id: String(offer.id),
            title: offer.Name || 'Member offer',
            description: offer.MCS_description || offer.Description || offer.C_BPartner_ID?.identifier || 'Exclusive member benefit',
            savings: offer.MCS_Savings ? `${offer.MCS_Savings}% off` : offer.MCS_Offers_Category_ID?.identifier || 'Featured',
          }));
        setDashboardOffers(offers);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setDashboardOffers([]);
      });
    return () => controller.abort();
  }, [location.countryId]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/data/jobs?featured=true&top=2&skip=0', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Failed to load featured jobs')))
      .then((data) => setFeaturedJobs(Array.isArray(data) ? data.slice(0, 2) : []))
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setFeaturedJobs([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('mcs_token');
    let userId = 0;
    try { userId = Number(JSON.parse(localStorage.getItem('mcs_user') || '{}').id) || 0; } catch { userId = 0; }
    const connectionRequest = token && userId
      ? fetch(`/api/mentorship/requests?userId=${encodeURIComponent(userId)}`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.ok ? response.json() : null)
      : Promise.resolve(null);

    Promise.all([fetch('/api/data/mentors', { cache: 'no-store' }).then((response) => response.ok ? response.json() : []), connectionRequest])
      .then(([mentorData, connectionData]) => {
        const ranked = (Array.isArray(mentorData) ? mentorData as Mentor[] : [])
          .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0))
          .slice(0, 5);
        setTopMentors(ranked);
        setAcceptedMentorIds(new Set(Array.isArray(connectionData?.mentorIds) ? connectionData.mentorIds.map(String) : []));
        setRequestedMentorIds(new Set(Array.isArray(connectionData?.requestedMentorIds) ? connectionData.requestedMentorIds.map(String) : []));
      })
      .catch(() => setTopMentors([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch('/api/data/scholarships', { signal: controller.signal, cache: 'no-store' }).then((response) => response.ok ? response.json() : []),
      fetch('/api/data/internships', { signal: controller.signal, cache: 'no-store' }).then((response) => response.ok ? response.json() : []),
    ]).then(([scholarships, internships]) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const combined: DashboardDeadline[] = [
        ...(Array.isArray(scholarships) ? scholarships : []).map((item: { id: string; title: string; deadline: string }) => ({ id: `scholarship-${item.id}`, title: item.title, date: new Date(item.deadline), kind: 'Scholarship' as const })),
        ...(Array.isArray(internships) ? internships : []).map((item: { id: string; role: string; when: string }) => ({ id: `internship-${item.id}`, title: item.role, date: new Date(item.when), kind: 'Internship' as const })),
      ];
      setUpcomingDeadlines(combined.filter((item) => !Number.isNaN(item.date.getTime()) && item.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 4));
    }).catch((error) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setUpcomingDeadlines([]);
    });
    return () => controller.abort();
  }, [location.country]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch('/api/data/emergency-contacts?top=20&skip=0', { signal: controller.signal, cache: 'no-store' }).then((response) => response.ok ? response.json() : []),
      fetch('/api/data/embassy?top=20&skip=0', { signal: controller.signal, cache: 'no-store' }).then((response) => response.ok ? response.json() : []),
    ]).then(([contacts, embassies]) => {
      const numbers: DashboardHelpline[] = [
        ...(Array.isArray(contacts) ? contacts : []).map((item: { id: string; title: string; phone: string }) => ({ id: `contact-${item.id}`, title: item.title, phone: item.phone })),
        ...(Array.isArray(embassies) ? embassies : []).map((item: { id: string; name: string; emergencyPhone?: string; telephone?: string }) => ({ id: `embassy-${item.id}`, title: item.name, phone: item.emergencyPhone || item.telephone || '' })),
      ].filter((item) => item.phone);
      setHelplines(numbers.filter((item, index) => numbers.findIndex((candidate) => candidate.phone === item.phone) === index).slice(0, 2));
    }).catch((error) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setHelplines([]);
    });
    return () => controller.abort();
  }, [location.country]);

  useEffect(() => {
    return onSnapshot(collection(db, 'groups'), (snapshot) => {
      const groups = snapshot.docs
        .map((group) => ({ id: group.id, ...group.data() } as DashboardGroup))
        .sort((a, b) => (Number(b.posts) || b.members?.length || 0) - (Number(a.posts) || a.members?.length || 0))
        .slice(0, 3);
      setTrendingGroups(groups);
    }, () => setTrendingGroups([]));
  }, []);

  useEffect(() => {
    let unsubscribeConnections = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeConnections();

      let userId = user?.uid;
      if (!userId) {
        try {
          const savedUser = JSON.parse(localStorage.getItem('mcs_user') || 'null');
          userId = savedUser?.uid || savedUser?.id || savedUser?.name;
        } catch {
          userId = undefined;
        }
      }

      if (!userId) {
        setStudentStatValues((current) => ({ ...current, connections: 0 }));
        return;
      }

      unsubscribeConnections = onSnapshot(
        collection(db, 'connections'),
        (snapshot) => {
          const count = snapshot.docs.reduce((total, connection) => {
            const data = connection.data();
            return data.userId1 === userId || data.userId2 === userId ? total + 1 : total;
          }, 0);
          setStudentStatValues((current) => ({ ...current, connections: count }));
        },
        () => setStudentStatValues((current) => ({ ...current, connections: 0 })),
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeConnections();
    };
  }, []);

  const handleMentorConnect = async (mentor: Mentor) => {
    if (!mentor.id) return;
    const token = localStorage.getItem('mcs_token');
    let userId = 0;
    let userName = '';
    try { const user = JSON.parse(localStorage.getItem('mcs_user') || '{}'); userId = Number(user.id) || 0; userName = String(user.name || ''); } catch { userId = 0; }
    if (!token || !userId) { router.push('/login'); return; }
    setConnectingMentorId(mentor.id);
    try {
      const response = await fetch('/api/mentorship/requests', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ Name: userName, AD_User_ID: userId, MCS_Mentor_ID: Number(mentor.id) }) });
      const data = await response.json();
      if (response.status === 401 || response.status === 403) { router.push('/login'); return; }
      if (!response.ok) throw new Error(data.error || 'Could not send request');
      setRequestedMentorIds((current) => new Set(current).add(String(mentor.id)));
      if (data.accepted === true) setAcceptedMentorIds((current) => new Set(current).add(String(mentor.id)));
      toast.add(data.accepted ? 'You are already connected with this mentor.' : 'Connection request sent.', 'success');
    } catch (error) {
      toast.add(error instanceof Error ? error.message : 'Could not send request', 'error');
    } finally {
      setConnectingMentorId(null);
    }
  };

  const studentStats = studentStatDefinitions.map((stat) => ({
    ...stat,
    value: studentStatValues[stat.key]?.toLocaleString() ?? '—',
  }));

  return (
    <div className={styles.dashboard}>
      <section className={`${styles.hero} ${styles.studentHero}`}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}><Sparkles size={13} /> AI powered</span>
          <h1>Namaskar, {firstName}.</h1>
          <p>Assess your strengths. Simulate real paths. Get AI-driven career insights.</p>
          <Link href="/career-simulator" className={styles.heroButton}>Start now <ArrowRight size={16} /></Link>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <span className={styles.sun} />
          <span className={styles.road} />
          <span className={styles.traveller}>◆</span>
          <span className={styles.signpost}>┤</span>
        </div>
      </section>

      <div className={styles.topGrid}>
        <section className={styles.panel}>
          <SectionTitle title="Your network overview" action={null} />
          <p className={styles.muted}>Updated 2 hours ago</p>
          <div className={styles.statGrid}>
            {studentStats.map(({ label, value, icon: StatIcon }) => (
              <div className={styles.statCard} key={label}>
                <StatIcon size={22} />
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className={styles.panel}>
          <SectionTitle title="Continue your journey" action={null} />
          <p className={styles.muted}>Pick up where you left off</p>
          <div className={styles.journeyGrid}>
            {journey.map((item) => {
              const content = <><span>{item.meta}</span><h3>{item.title}</h3><small>{item.progress} →</small></>;
              const className = `${styles.journeyCard} ${styles[item.tone]}`;
              const style = { backgroundImage: `linear-gradient(0deg, rgba(31, 16, 9, 0.9) 0%, rgba(31, 16, 9, 0.12) 76%), url(${item.image})` };
              return item.href ? (
                <Link href={item.href} className={className} style={style} key={item.title}>{content}</Link>
              ) : (
                <button type="button" onClick={() => setResumeBuilderOpen(true)} className={className} style={style} key={item.title}>{content}</button>
              );
            })}
          </div>
        </section>
      </div>

      <div className={styles.studentMiddle}>
        <section className={styles.panel}>
          <SectionTitle title="Quick access" action={null} />
          <div className={styles.quickGrid}>{quickLinks.map(({ label, href, icon: QuickIcon }) => <Link key={label} href={href}><QuickIcon size={19}/><span>{label}</span></Link>)}</div>
        </section>
        <section className={styles.panel}>
          <SectionTitle title="MCS offers for you" href="/offers" />
          <div className={styles.offerList}>
            {dashboardOffers === null ? <p className={styles.emptyState}>Loading offers...</p> : dashboardOffers.length ? dashboardOffers.map((offer) => <div key={offer.id}><b>{offer.title}</b><span>{offer.description}</span><em>{offer.savings}</em></div>) : <p className={styles.emptyState}>No offers available for {location.country || 'selected country'}.</p>}
          </div>
        </section>
        <section className={styles.panel}>
          <SectionTitle title="Top mentors this week" href="/mentorship" />
          <div className={styles.peopleRow}>{topMentors === null ? <p className={styles.emptyState}>Loading mentors...</p> : topMentors.length ? topMentors.map((mentor) => { const id = String(mentor.id || ''); const initials = mentor.name.split(/s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); const accepted = acceptedMentorIds.has(id); const requested = requestedMentorIds.has(id); return <article key={id || mentor.name}><div className={styles.avatar}>{initials}</div><b>{mentor.name}</b><span>{mentor.role}</span><small className={styles.mentorRating}>★ {mentor.rating ? mentor.rating.toFixed(1) : 'New'}</small><button type="button" disabled={!id || accepted || requested || connectingMentorId === id} onClick={() => handleMentorConnect(mentor)}>{connectingMentorId === id ? 'Sending...' : accepted ? 'Connected' : requested ? 'Request sent' : 'Connect'}</button></article>; }) : <p className={styles.emptyState}>No mentors available.</p>}</div>
        </section>
      </div>

      <div className={styles.bottomGrid}>
        <section className={styles.panel}>
          <SectionTitle title="MRS jobs" href="/jobs" />
          <div className={styles.featureJobList}>
            {featuredJobs === null ? <p className={styles.emptyState}>Loading jobs...</p> : featuredJobs.length ? featuredJobs.map((job) => <article className={styles.featureJob} key={job.id}><div className={styles.companyLogo}>{job.logo}</div><div><span className={styles.badge}>Featured</span><h3>{job.role}</h3><p>{job.co} · {job.loc}</p><small>{job.exp} · {job.pay}</small></div><Link href="/jobs">Apply now</Link></article>) : <p className={styles.emptyState}>No featured jobs available.</p>}
          </div>
        </section>
        <section className={styles.panel}>
          <SectionTitle title="Upcoming deadlines" href="/learn" />
          <div className={styles.deadlines}>{upcomingDeadlines === null ? <p className={styles.emptyState}>Loading deadlines...</p> : upcomingDeadlines.length ? upcomingDeadlines.map((deadline) => <div key={deadline.id}><b>{deadline.date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase()}</b><span>{deadline.title}</span><small>{deadline.kind} deadline</small></div>) : <p className={styles.emptyState}>No upcoming deadlines.</p>}</div>
        </section>
        <section className={`${styles.panel} ${styles.helpPanel}`}>
          <div className={styles.helpHeading}><h2>MCS Helpline</h2><span className={styles.live}>● Live</span></div><p className={styles.helpSubtitle}>24/7 support in {location.country || 'your country'}</p><div className={styles.helplineList}>{helplines === null ? <span>Loading helplines...</span> : helplines.length ? helplines.map((helpline) => <a key={helpline.id} href={`tel:${helpline.phone}`}><small>{helpline.title}</small><b>{helpline.phone}</b></a>) : <span>No helpline number available.</span>}</div>{helplines?.[0] && <div className={styles.helpAction}><div><h3>Need assistance?</h3><p>Call selected-country support</p></div><a href={`tel:${helplines[0].phone}`}>Call now</a></div>}
        </section>
        <section className={styles.panel}>
          <SectionTitle title="Trending in your network" href="/community" />
          <div className={styles.feed}>{trendingGroups === null ? <p className={styles.emptyState}>Loading groups...</p> : trendingGroups.length ? trendingGroups.map((group, index) => <Link href="/community" key={group.id}><span>{index + 1}</span><p><b>{group.name}</b><small>{(group.members?.length || 0).toLocaleString()} members · {group.posts || 'Active now'}</small></p></Link>) : <p className={styles.emptyState}>No trending groups available.</p>}</div>
        </section>
      </div>
      <ResumeBuilderModal isOpen={resumeBuilderOpen} onClose={() => setResumeBuilderOpen(false)} />
    </div>
  );
}

function MetricCard({ icon: MetricIcon, label, value, note }: { icon: IconType; label: string; value: string; note: string }) {
  return <article className={styles.metric}>
    <MetricIcon size={22}/><span>{label}</span><strong>{value}</strong><small>{note}</small>
  </article>;
}
function EntrepreneurDashboard() {
  const [firstName, setFirstName] = useState('Entrepreneur');
  const [businesses, setBusinesses] = useState<EntrepreneurBusiness[] | null>(null);
  const [services, setServices] = useState<EntrepreneurService[] | null>(null);
  const [requests, setRequests] = useState<EntrepreneurRequest[] | null>(null);
  const [ownedOfferCount, setOwnedOfferCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let userId = 0;
    let token = '';
    let loadedFirstName = 'Entrepreneur';
    try {
      const user = JSON.parse(localStorage.getItem('mcs_user') || '{}');
      userId = Number(user.id) || 0;
      token = localStorage.getItem('mcs_token') || '';
      loadedFirstName = String(user.name || 'Entrepreneur').split(' ')[0];
    } catch {
      loadedFirstName = 'Entrepreneur';
    }

    const loadJson = async (url: string, headers?: HeadersInit) => {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers });
      if (!response.ok) return null;
      return response.json();
    };

    Promise.all([
      loadJson('/api/v1/models/user-businesses'),
      loadJson('/api/v1/services/my'),
      loadJson('/api/v1/models/MCS_Maid_Booking'),
      userId ? loadJson(`/api/v1/models/MCS_Taxi_Service_Request?scope=driver&userId=${encodeURIComponent(userId)}`) : Promise.resolve(null),
      loadJson('/api/v1/models/MCS_Offers?top=100&skip=0'),
      token ? loadJson('/api/mentorship/requests?received=true', { Authorization: `Bearer ${token}` }) : Promise.resolve(null),
    ]).then(([businessData, serviceData, maidData, taxiData, offerData, mentorData]) => {
      setFirstName(loadedFirstName);
      const businessRecords = Array.isArray(businessData?.records) ? businessData.records as EntrepreneurBusiness[] : [];
      const serviceRecords = Array.isArray(serviceData?.services) ? serviceData.services as EntrepreneurService[] : [];
      setBusinesses(businessRecords);
      setServices(serviceRecords);

      const maidRequests: EntrepreneurRequest[] = (Array.isArray(maidData?.records) ? maidData.records : []).map((request: Record<string, unknown>) => ({
        id: `maid-${String(request.id || '')}`,
        kind: 'Maid',
        title: Array.isArray(request.services) && request.services.length ? request.services.map(String).join(', ') : 'Maid service request',
        detail: String(request.address || request.notes || 'Service details available'),
        customer: String(request.name || 'Community member'),
        href: '/maids',
      }));
      const taxiRequests: EntrepreneurRequest[] = (Array.isArray(taxiData?.records) ? taxiData.records : []).map((request: Record<string, unknown>) => ({
        id: `taxi-${String(request.id || '')}`,
        kind: 'Taxi',
        title: `${String(request.MCS_Pickup || 'Pickup')} → ${String(request.MCS_Drop || 'Destination')}`,
        detail: request.MCS_TripDate ? new Date(String(request.MCS_TripDate)).toLocaleString() : 'Trip request',
        customer: String((request.AD_User_ID as { identifier?: string } | undefined)?.identifier || 'Community member'),
        href: '/taxi',
      }));
      const mentorRequests: EntrepreneurRequest[] = (Array.isArray(mentorData) ? mentorData : []).map((request: Record<string, unknown>) => ({
        id: `mentor-${String(request.id || '')}`,
        kind: 'Mentorship',
        title: String(request.name || request.Name || 'Mentorship request'),
        detail: String(request.topic || request.Description || 'Career guidance request'),
        customer: String(request.userName || request.AD_User_ID || 'Community member'),
        href: '/mentorship',
      }));
      setRequests([...maidRequests, ...taxiRequests, ...mentorRequests].slice(0, 5));

      const offerRecords = Array.isArray(offerData?.records) ? offerData.records as Array<Record<string, unknown>> : [];
      const userOffers = offerRecords.filter((offer) => {
        const owner = offer.AD_User_ID;
        const ownerId = owner && typeof owner === 'object' ? (owner as { id?: string | number }).id : owner;
        return userId > 0 && String(ownerId || '') === String(userId) && offer.IsActive !== false;
      });
      setOwnedOfferCount(userOffers.length);
    }).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setBusinesses([]);
      setServices([]);
      setRequests([]);
      setOwnedOfferCount(0);
    });

    return () => controller.abort();
  }, []);

  const requestCount = requests?.length ?? null;
  const listingCount = services?.length ?? null;
  const businessCount = businesses?.length ?? null;
  const activeBusiness = businesses?.[0]?.name || 'No business selected';
  const serviceKinds = services?.reduce<Record<string, number>>((counts, service) => {
    const label = service.kind.charAt(0).toUpperCase() + service.kind.slice(1);
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {}) || {};

  return (
    <div className={styles.dashboard}>
      <section className={`${styles.hero} ${styles.businessHero}`}>
        <div className={styles.heroCopy}><h1>Good morning, {firstName}! 👋</h1><h3>Build. Grow. Impact.</h3><p>Manage your business, access opportunities and grow with MCS.</p></div>
        <Link href="/businesses" className={styles.businessPicker}><span>Your active business</span><b>{businesses === null ? 'Loading...' : activeBusiness}</b><ArrowRight size={16}/></Link>
        <div className={styles.heroArt} aria-hidden="true"><span className={styles.sun}/><span className={styles.road}/><span className={styles.traveller}>◆</span><span className={styles.signpost}>┤</span></div>
      </section>

      <section className={styles.panel}>
        <SectionTitle title="Quick access" action={null} />
        <div className={styles.entrepreneurQuickGrid}>
          <Link href="/businesses"><Store size={20}/><span>Add business</span><small>Create business profile</small></Link>
          <Link href="/offers"><HandCoins size={20}/><span>Post offer</span><small>Promote member deals</small></Link>
          <Link href="/taxi"><FileText size={20}/><span>Requests</span><small>{requestCount === null ? 'Loading...' : `${requestCount} open requests`}</small></Link>
          <Link href="/marketplace"><TrendingUp size={20}/><span>Boost listing</span><small>Reach more members</small></Link>
          <Link href="/profile"><BadgeCheck size={20}/><span>Business profile</span><small>Manage verification</small></Link>
        </div>
      </section>

      <section className={styles.panel}>
        <SectionTitle title="Business dashboard" action={null} />
        <div className={styles.metricsGrid}>
          <MetricCard icon={Users} label="Open requests" value={requestCount === null ? '—' : String(requestCount)} note="Across your services" />
          <MetricCard icon={Store} label="Active listings" value={listingCount === null ? '—' : String(listingCount)} note="Published services" />
          <MetricCard icon={Building2} label="Businesses" value={businessCount === null ? '—' : String(businessCount)} note="Owned profiles" />
          <article className={styles.growthCard}><div className={styles.growthSummary}><span>Service portfolio</span><strong>{ownedOfferCount === null ? '—' : ownedOfferCount}</strong><small>Active member offers</small></div><div className={styles.portfolioBreakdown}>{Object.keys(serviceKinds).length ? Object.entries(serviceKinds).map(([kind, count]) => <div key={kind}><span>{kind}</span><b>{count}</b></div>) : <p>{services === null ? 'Loading service mix...' : 'Create your first service listing.'}</p>}</div></article>
        </div>
      </section>

      <div className={styles.businessOverviewGrid}>
        <section className={styles.panel}><SectionTitle title="Service requests" action={null} /><div className={styles.requestCards}>{requests === null ? <p className={styles.emptyState}>Loading requests...</p> : requests.length ? requests.map((request) => <article key={request.id}><span>{request.kind}</span><div><b>{request.title}</b><small>{request.detail} · {request.customer}</small></div><Link href={request.href}>Review <ArrowRight size={13}/></Link></article>) : <p className={styles.emptyState}>No open service requests.</p>}</div></section>
        <section className={styles.panel}><SectionTitle title="Your businesses" href="/businesses" /><div className={styles.businessList}>{businesses === null ? <p className={styles.emptyState}>Loading businesses...</p> : businesses.length ? businesses.slice(0, 4).map((business)=><div key={business.id}><Store size={18}/><p><b>{business.name}</b><small>Business profile</small></p><span>Active</span></div>) : <p className={styles.emptyState}>No businesses created yet.</p>}</div><Link href="/businesses" className={styles.textAction}>+ Add new business</Link></section>
        <section className={styles.panel}><SectionTitle title="Performance" action={null} /><div className={styles.performance}>{[[String(businessCount ?? '—'),'Businesses'],[String(listingCount ?? '—'),'Listings'],[String(requestCount ?? '—'),'Requests'],[String(ownedOfferCount ?? '—'),'Offers']].map(([v,l])=><div key={l}><strong>{v}</strong><span>{l}</span></div>)}</div></section>
      </div>

      <div className={styles.businessToolsGrid}>
        <section className={styles.panel}><SectionTitle title="Active services" action={null} /><div className={styles.businessList}>{services === null ? <p className={styles.emptyState}>Loading services...</p> : services.length ? services.slice(0, 4).map((service)=><div key={`${service.kind}-${service.id}`}><Store size={18}/><p><b>{service.title}</b><small>{service.subtitle || service.meta.join(' · ')}</small></p><span>{service.kind}</span></div>) : <p className={styles.emptyState}>No active service listings.</p>}</div></section>
        <section className={styles.panel}><SectionTitle title="Action center" action={null} /><div className={styles.actionGrid}>{[[HandCoins,'Offers','/offers'],[BadgeCheck,'Profile','/profile'],[ClipboardCheck,'Requests','/taxi'],[IndianRupee,'Rates','/rates'],[Lightbulb,'Learn','/learn'],[TrendingUp,'Marketplace','/marketplace']].map(([ActionIcon,label,href])=>{const A=ActionIcon as IconType; return <Link href={href as string} key={label as string}><A size={18}/><span>{label as string}</span></Link>})}</div></section>
      </div>

    </div>
  );
}
export default function RoleDashboard({ kind }: { kind: DashboardKind }) {
  return kind === 'student' ? <StudentDashboard /> : <EntrepreneurDashboard />;
}
