'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { C } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, Avatar, SectionHead, PageHeader, Stat, useGlobalToast } from '@/components/primitives';
import { mentorStats, type Mentor } from '@/data/mentorship';
import BecomeMentorModal from './BecomeMentorModal';
import CreateWebinarModal, { type EditableWebinar } from './CreateWebinarModal';
import MentorRequestsSection from './MentorRequestsSection';
import styles from './page.module.css';

type MentorshipCategory = { id: string; name: string };
type MentorWebinar = {
  id: string; title: string; description: string; help: string; mentorId: string; mentorName: string;
  date: string; time: string; timeZone: string; paid: boolean; price: number; currency: string;
  topic: string; status: string; statusCode: string; currencyId: string; imageId: string; registrationUrl: string; tone: string;
};
const PAGE_SIZE = 6;


export default function MentorshipPage() {
  const [active, setActive] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [becomeMentorOpen, setBecomeMentorOpen] = useState(false);
  const [createWebinarOpen, setCreateWebinarOpen] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState<EditableWebinar | null>(null);
  const [currentMentorId, setCurrentMentorId] = useState('');
  const [deletingWebinarId, setDeletingWebinarId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('Best match');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [categories, setCategories] = useState<MentorshipCategory[]>([]);
  const [webinars, setWebinars] = useState<MentorWebinar[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [acceptedMentorIds, setAcceptedMentorIds] = useState<Set<string>>(new Set());
  const [requestedMentorIds, setRequestedMentorIds] = useState<Set<string>>(new Set());
  const [connectingMentorId, setConnectingMentorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useGlobalToast();

  useEffect(() => {
    let userId = 0;
    const token = localStorage.getItem('mcs_token');

    try { userId = Number(JSON.parse(localStorage.getItem('mcs_user') || '{}').id) || 0; } catch { userId = 0; }
    const acceptedMentorsRequest = token && userId
      ? fetch(`/api/mentorship/requests?userId=${encodeURIComponent(userId)}`, { headers: { Authorization: `Bearer ${token}` } }).then(response => response.ok ? response.json() : null)
      : Promise.resolve(null);
    Promise.all([
      fetch('/api/data/mentors').then(res => res.json()),
      fetch('/api/data/mentorship-categories').then(res => res.json()),
      fetch('/api/v1/models/MCS_MentorWebinar').then(res => res.json()),
      acceptedMentorsRequest,
    ])
      .then(([mentorData, categoryData, webinarData, acceptedData]) => {
        setMentors(Array.isArray(mentorData) ? mentorData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setWebinars(Array.isArray(webinarData) ? webinarData : []);
        setLoggedIn(Boolean(token && userId));
        setCurrentMentorId(token && userId ? localStorage.getItem('MCS_Mentor_ID') || '' : '');
        setAcceptedMentorIds(new Set(Array.isArray(acceptedData?.mentorIds) ? acceptedData.mentorIds.map(String) : []));
        setRequestedMentorIds(new Set(Array.isArray(acceptedData?.requestedMentorIds) ? acceptedData.requestedMentorIds.map(String) : []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myMentors = mentors.filter(mentor => mentor.id && acceptedMentorIds.has(String(mentor.id)));
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMentors = useMemo(() => mentors.filter(mentor => {
    const matchesCategory = active === 'All' || mentor.topics.some(topic =>
      topic.toLowerCase().includes(active.toLowerCase()) || active.toLowerCase().includes(topic.toLowerCase()) ||
      (active === 'Tech' && topic.includes('Engineer')) || (active === 'Design' && topic.includes('Design')) ||
      (active === 'Business' && topic.includes('Product'))
    );
    const matchesSearch = !normalizedQuery || [
      mentor.name,
      mentor.role,
      mentor.city,
      mentor.mandal,
      mentor.rate,
      ...mentor.topics,
    ].some(value => String(value || '').toLowerCase().includes(normalizedQuery));
    return matchesCategory && matchesSearch;
  }), [active, mentors, normalizedQuery]);


  const loadMore = useCallback(() => {
    setVisibleCount(count => Math.min(count + PAGE_SIZE, filteredMentors.length));
  }, [filteredMentors.length]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: '240px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleConnect = async (mentor: Mentor) => {
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
    setRequestedMentorIds(current => new Set(current).add(String(mentor.id)));
    if (data.accepted === true) setAcceptedMentorIds(current => new Set(current).add(String(mentor.id)));
    toast.add(data.accepted ? 'You are already connected with this mentor.' : 'Connection request sent.', 'success');
  } catch (error) {
    toast.add(error instanceof Error ? error.message : 'Could not send request', 'error');
  } finally { setConnectingMentorId(null); }
  };


  const handleDeleteWebinar = async (webinar: MentorWebinar) => {
    if (!window.confirm('Delete this webinar?')) return;
    setDeletingWebinarId(webinar.id);
    try {
      const response = await fetch('/api/v1/models/MCS_MentorWebinar/' + webinar.id, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not delete webinar');
      setWebinars(current => current.filter(item => item.id !== webinar.id));
      toast.add('Webinar deleted.', 'success');
    } catch (error) {
      toast.add(error instanceof Error ? error.message : 'Could not delete webinar.', 'error');
    } finally {
      setDeletingWebinarId(null);
    }
  };
  return (
    <div className={styles.page}>
      <PageHeader
        title="Mentorship"
        marathi="मार्गदर्शन"
        subtitle={`${loading ? '...' : mentors.length} mentors offering time · book a 30-min session free with most`}
        actions={<>
          {loggedIn && currentMentorId && <Btn kind="primary" size="md" iconL="plus" onClick={() => { setEditingWebinar(null); setCreateWebinarOpen(true); }}>Create webinar</Btn>}
          {/* <Btn kind="ghost" size="md" iconL="cal">My sessions</Btn> */}
          {!currentMentorId && <Btn kind="dark" size="md" iconL="plus" onClick={() => { if (!loggedIn) { router.push('/login'); return; } setBecomeMentorOpen(true); }}>Become a mentor</Btn>}
        </>}
      />

      <div className={`mob-2col ${styles.statsGrid}`}>
        {mentorStats.map((s, i) => (
          <Card key={i} pad={20}><Stat value={i === 0 ? (loading ? '-' : String(mentors.length)) : s.v} label={s.l} hint={s.h}/></Card>
        ))}
      </div>

      {/* Your sessions */}
      {/* <Card pad={0}>
        <div className={styles.sessionsHeader}>
          <div>
            <div className={styles.sessionsTitle}>Your sessions</div>
            <div className={styles.sessionMeta}>{sessions.filter(s => s.status === 'upcoming').length} upcoming · {sessions.filter(s => s.status === 'past').length} completed this month</div>
          </div>
          <Btn kind="ghost" size="sm">View all</Btn>
        </div>
        {sessions.map((s, i) => {
          const st = statusStyles[s.status];
          return (
            <div key={i} className={`mob-stack ${styles.sessionRow} ${i === sessions.length - 1 ? styles.lastRow : ''}`}>
              <Avatar name={s.with} size={40}/>
              <div className={styles.minWidthZero}>
                <div className={styles.sessionTopic}>{s.topic}</div>
                <div className={styles.sessionMeta}>with {s.with} · {s.when}</div>
              </div>
              <span className={`${styles.status} ${s.status === 'upcoming' ? styles.upcoming : styles.past}`}>● {st.label}</span>
              <Btn kind={s.status === 'upcoming' ? 'primary' : 'outline'} size="sm">
                {s.status === 'upcoming' ? 'Join call' : 'View notes'}
              </Btn>
            </div>
          );
        })}
      </Card> */}

      {loggedIn && currentMentorId && <MentorRequestsSection/>}

      {loggedIn && <section>
        <SectionHead title="My mentors" subtitle={`${myMentors.length} connected mentors`}/>
        {myMentors.length === 0 ? <Card><div className={styles.myMentorsEmpty}>You do not have any accepted mentor connections yet.</div></Card> : <div className={styles.myMentorsGrid}>
          {myMentors.map(mentor => <Card key={mentor.id} interactive className={styles.myMentorCard} onClick={() => router.push(`/mentorship/${mentor.id}`)}>
            <Avatar name={mentor.name} size={48}/>
            <div className={styles.myMentorInfo}><strong>{mentor.name}</strong><span>{mentor.role}</span><small>{mentor.mandal}</small></div>
            <Btn kind="outline" size="sm" onClick={event => { event.stopPropagation(); router.push(`/mentorship/${mentor.id}`); }}>View profile</Btn>
          </Card>)}
        </div>}
      </section>}

      <div className={styles.searchWrap}>
        <Icon name="search" size={18} color="#6B6256"/>
        <input
          type="search"
          value={searchQuery}
          onChange={event => { setSearchQuery(event.target.value); setVisibleCount(PAGE_SIZE); }}
          placeholder="Search mentors, roles, industries, categories..."
          aria-label="Search mentors"
          className={styles.searchInput}
        />
        {searchQuery && <button type="button" className={styles.clearSearch} onClick={() => { setSearchQuery(''); setVisibleCount(PAGE_SIZE); }} aria-label="Clear search">×</button>}
      </div>

      <div className={styles.filters}>
        <Pill active={active === 'All'} onClick={() => { setActive('All'); setVisibleCount(PAGE_SIZE); }}>All</Pill>
        {categories.map(category => <Pill key={category.id} active={active === category.name} onClick={() => { setActive(category.name); setVisibleCount(PAGE_SIZE); }}>{category.name}</Pill>)}
      </div>

      {/* Mentor grid */}
      <section>
        <SectionHead
          title="Find a mentor"
          subtitle={`Showing ${filteredMentors.length} of ${mentors.length}`}
          action={
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={styles.sortSelect}>
              <option value="Best match">Sort: Best match</option>
              <option value="Experience">Sort: Experience</option>
            </select>
          }
        />
        <div className={`mob-stack ${styles.mentorGrid}`}>
          {loading ? <div className={styles.mentorMessage}>Loading mentors...</div> : filteredMentors.length === 0 ? <div className={styles.mentorMessage}>No mentors found.</div> : null}
          {filteredMentors.slice(0, visibleCount).map((m, i) => (
            <Card key={m.id || i} interactive onClick={() => m.id && router.push(`/mentorship/${m.id}`)}>
              <div className={styles.mentorHeader}>
                <Avatar name={m.name} size={52}/>
                <div className={styles.mentorIdentity}>
                  <div className={styles.mentorName}>{m.name}</div>
                  <div className={styles.mentorRole}>{m.role}</div>
                  <div className={styles.mentorLocation}>
                    {m.city} · {m.mandal}
                  </div>
                  <div className={styles.mentorRating}><span>★</span> {m.rating ? m.rating.toFixed(1) : 'New'}{Boolean(m.reviewCount) && <small> ({m.reviewCount} reviews)</small>}</div>
                </div>
              </div>

              <div className={styles.topics}>
                {m.topics.map(t => <Tag key={t} color={C.ink2} bg={C.bgDeep}>{t}</Tag>)}
              </div>

              <div className={styles.topics}>
                {m.languages?.map(l => <Tag key={l} color={C.ink2} bg={C.bgDeep}>{l}</Tag>)}
              </div>

              <div className={styles.descriptionContainer}>
                {m.description && <div className={styles.description}>{m.description}</div>}
              </div>

              <div className={styles.metrics}>
                <div>
                  <div className={styles.metricLabel}>YEARS</div>
                  <div className={`num ${styles.metricValue}`}>{m.years}+</div>
                </div>

                <div>
                  <div className={styles.metricLabel}>RATE</div>
                  <div className={`${styles.rate} ${m.rate === 'Free' ? styles.available : ''}`}>{m.rate}</div>
                </div>

                <div>
                  <div className={styles.metricLabel}>CONNECTIONS</div>
                  <div className={styles.metricValue}>{m.connectionCount || 0}</div>
                </div>
              </div>

              <div className={styles.cardActions}>
                <Btn kind={m.id && acceptedMentorIds.has(String(m.id)) ? 'soft' : m.id && requestedMentorIds.has(String(m.id)) ? 'soft' : 'primary'} size="sm" full disabled={!m.id || connectingMentorId === m.id || Boolean(m.id && requestedMentorIds.has(String(m.id)))} onClick={event => { event.stopPropagation(); handleConnect(m); }}>{connectingMentorId === m.id ? 'Sending...' : m.id && acceptedMentorIds.has(String(m.id)) ? 'Connected' : m.id && requestedMentorIds.has(String(m.id)) ? 'Request sent' : 'Connect with mentor'}</Btn>
                <Btn
                  kind="outline"
                  size="sm"
                  aria-label={`Chat with ${m.name}`}
                  onClick={event => {
                    event.stopPropagation();
                    localStorage.setItem('mcs_login_return', `/chat?user=${encodeURIComponent(m.name)}`);
                    router.push(`/chat?user=${encodeURIComponent(m.name)}`);
                  }}
                >
                  <Icon name="chat" size={14}/>
                </Btn>
              </div>
            </Card>
          ))}
        </div>
        {!loading && visibleCount < filteredMentors.length && <div ref={loadMoreRef} className={styles.loadMore} aria-label="Loading more mentors"><span/></div>}
      </section>

      <section>
        <SectionHead title="Mentor webinars" subtitle={loading ? 'Loading webinars...' : `${webinars.length} upcoming and recorded sessions`}/>
        <div className={styles.webinarGrid}>
          {loading ? <div className={styles.mentorMessage}>Loading webinars...</div> : webinars.length === 0 ? <div className={styles.mentorMessage}>No mentor webinars found.</div> : webinars.map(webinar => {
            const formattedDate = webinar.date ? new Date(`${webinar.date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date to be announced';
            const price = webinar.paid ? `${webinar.currency} ${webinar.price}`.trim() : 'Free';
            return <Card key={webinar.id} interactive className={styles.webinarCard} onClick={() => webinar.mentorId && router.push(`/mentorship/${webinar.mentorId}`)}>
              <div className={styles.webinarTop}><Tag color={C.ink2} bg={C.bgDeep}>{webinar.topic}</Tag><span className={styles.webinarStatus}>{webinar.status}</span></div>
              <h3 className={styles.webinarTitle}>{webinar.title}</h3>
              <p className={styles.webinarDescription}>{webinar.description || webinar.help || 'Join this webinar hosted by an MCS mentor.'}</p>
              <div className={styles.webinarMeta}><span><Icon name="cal" size={14}/> {formattedDate}</span>{webinar.time && <span><Icon name="clock" size={14}/> {webinar.time.replace('Z', '')}</span>}</div>
              <div className={styles.webinarFooter}><div><span>Hosted by</span><strong>{webinar.mentorName}</strong></div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Tag color={webinar.paid ? C.saffronDk : C.green} bg={webinar.paid ? C.saffronLt : C.greenLt}>{price}</Tag>{currentMentorId !== webinar.mentorId && <Btn kind="primary" size="sm" disabled={!webinar.registrationUrl} onClick={event => { event.stopPropagation(); if (webinar.registrationUrl) window.open(webinar.registrationUrl, '_blank', 'noopener,noreferrer'); }}>Enroll</Btn>}</div></div>
              {currentMentorId === webinar.mentorId && <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><Btn kind="outline" size="sm" full onClick={event => { event.stopPropagation(); setEditingWebinar(webinar); setCreateWebinarOpen(true); }}>Edit</Btn><Btn kind="ghost" size="sm" full disabled={deletingWebinarId === webinar.id} onClick={event => { event.stopPropagation(); void handleDeleteWebinar(webinar); }}>{deletingWebinarId === webinar.id ? 'Deleting...' : 'Delete'}</Btn></div>}
            </Card>;
          })}
        </div>
      </section>
      <BecomeMentorModal isOpen={becomeMentorOpen} onClose={() => setBecomeMentorOpen(false)} onCreated={async () => { const response = await fetch('/api/data/mentors', { cache: 'no-store' }); if (response.ok) setMentors(await response.json()); }} />
      <CreateWebinarModal key={editingWebinar?.id || 'new'} isOpen={createWebinarOpen} webinar={editingWebinar} onClose={() => { setCreateWebinarOpen(false); setEditingWebinar(null); }} onCreated={async () => { const response = await fetch('/api/v1/models/MCS_MentorWebinar', { cache: 'no-store' }); if (response.ok) setWebinars(await response.json()); }} />

    </div>
  );
}
