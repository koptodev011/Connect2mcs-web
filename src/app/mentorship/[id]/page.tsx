'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { Avatar, Btn, Card, PageHeader, Tag, useGlobalToast } from '@/components/primitives';
import CreateWebinarModal, { type EditableWebinar } from '../CreateWebinarModal';
import styles from './page.module.css';

type MentorDetail = {
  id: string; name: string; bio: string; description: string; designation: string; company: string;
  industry: string; category: string; years: number; verified: boolean; rate: number; currency: string;
  languages: string[]; user: string; created: string; updated: string; rating: number; reviewCount: number; connectionCount: number;
};
type Webinar = EditableWebinar & { duration: string; url: string; currency?: string };
type Review = { id: string; userName: string; rating: number; review: string; date: string };
type DetailResponse = { mentor?: MentorDetail; reviews?: Review[]; webinars?: Webinar[] };

export default function MentorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mentor, setMentor] = useState<MentorDetail | null>(null);
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [requested, setRequested] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState<Webinar | null>(null);
  const [deletingWebinarId, setDeletingWebinarId] = useState<string | null>(null);
  const [isOwner] = useState(() => typeof window !== 'undefined' && localStorage.getItem('MCS_Mentor_ID') === id);
  const router = useRouter();
  const toast = useGlobalToast();

  useEffect(() => {
    fetch(`/api/data/mentor-details?id=${encodeURIComponent(id)}`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Mentor not found')))
      .then(async (data: DetailResponse) => { setMentor(data.mentor || null); setReviews(data.reviews || []); setWebinars(data.webinars || []); if (localStorage.getItem('MCS_Mentor_ID') === id) { const response = await fetch('/api/v1/models/MCS_MentorWebinar', { cache: 'no-store' }); if (response.ok) { const owned = await response.json() as Array<Webinar & { mentorId?: string }>; setWebinars(owned.filter(webinar => webinar.mentorId === id)); } } })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem('mcs_token');
    let userId = 0;
    try { userId = Number(JSON.parse(localStorage.getItem('mcs_user') || '{}').id) || 0; } catch { userId = 0; }
    if (!token || !userId) return;
    fetch(`/api/mentorship/requests?mentorId=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => { setAccepted(data.accepted === true); setRequested(data.requested === true); })
      .catch(() => undefined);
  }, [id]);

  const handleConnect = async () => {
    const token = localStorage.getItem('mcs_token');
    let userId = 0;
    let userName = '';
    try { const savedUser = JSON.parse(localStorage.getItem('mcs_user') || '{}'); userId = Number(savedUser.id) || 0; userName = String(savedUser.name || ''); } catch { userId = 0; userName = ''; }
    if (!token || !userId) { router.push('/login'); return; }
    setConnecting(true);
    try {
      const response = await fetch('/api/mentorship/requests', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ Name: userName, AD_User_ID: userId, MCS_Mentor_ID: Number(id) }) });
      const data = await response.json();
      if (response.status === 401) { router.push('/login'); return; }
      if (!response.ok) throw new Error(data.error || 'Could not send request');
      setAccepted(data.accepted === true);
      setRequested(true);
      toast.add(data.accepted ? 'You are already connected with this mentor.' : 'Connection request sent.', 'success');
    } catch (error) {
      toast.add(error instanceof Error ? error.message : 'Could not send request', 'error');
    } finally { setConnecting(false); }
  };


  const refreshOwnedWebinars = async () => {
    const response = await fetch('/api/v1/models/MCS_MentorWebinar', { cache: 'no-store' });
    if (!response.ok) return;
    const records = await response.json() as Array<Webinar & { mentorId?: string }>;
    setWebinars(records.filter(webinar => webinar.mentorId === id));
  };

  const handleDeleteWebinar = async (webinar: Webinar) => {
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
  const connectButton = !accepted ? <Btn kind={requested ? 'soft' : 'primary'} size="lg" onClick={handleConnect} disabled={connecting || requested}>{connecting ? 'Sending...' : requested ? 'Request sent' : 'Connect with mentor'}</Btn> : null;

  if (loading) return <div className={styles.message}>Loading mentor details...</div>;
  if (!mentor) return notFound();
  const role = [mentor.designation, mentor.company].filter(Boolean).join(' · ') || mentor.industry;
  const rate = mentor.rate > 0 ? `${mentor.currency} ${mentor.rate}`.trim() : 'Free';

  return <div className={styles.page}>
    <div><Link href="/mentorship" className={styles.back}><Icon name="chevL" size={14} /> Back to Mentorship</Link>
      <PageHeader title={mentor.name} subtitle={role} actions={connectButton} />
    </div>
    <div className={`${styles.profileGrid} mob-stack`}>
      <main className={styles.main}>
        <Card pad={28}>
          <div className={styles.identity}><Avatar name={mentor.name} size={76} /><div><div className={styles.nameLine}><h2>{mentor.name}</h2>{mentor.verified && <Tag color="#1F7A3A" bg="#E1F2E6">● Verified</Tag>}</div><p>{role}</p><span>{mentor.industry} · {mentor.category}</span><div className={styles.ratingLine}><b>★ {mentor.rating ? mentor.rating.toFixed(1) : 'New'}</b><small>{mentor.reviewCount} reviews</small></div></div></div>
          <div className={styles.about}><h3>About the mentor</h3><p>{mentor.bio || mentor.description || 'This mentor has not added a biography yet.'}</p></div>
          {mentor.languages.length > 0 && <div><h3 className={styles.sectionTitle}>Languages</h3><div className={styles.tags}>{mentor.languages.map(language => <Tag key={language}>{language}</Tag>)}</div></div>}
        </Card>
        <section><div className={styles.heading}><div><h2>Reviews</h2><p>Feedback from connected community members</p></div><span>{reviews.length} reviews</span></div>
          {reviews.length === 0 ? <Card><div className={styles.empty}>No reviews have been submitted for this mentor yet.</div></Card> : <div className={styles.reviewList}>{reviews.map(review => <Card key={review.id}><div className={styles.reviewTop}><div><strong>{review.userName}</strong><span>{review.date ? new Date(review.date).toLocaleDateString() : ''}</span></div><b>★ {review.rating || '-'}</b></div>{review.review && <p>{review.review}</p>}</Card>)}</div>}
        </section>
        <section><div className={styles.heading}><div><h2>Webinars</h2><p>Sessions hosted by {mentor.name}</p></div><span>{webinars.length} available</span></div>
          {webinars.length === 0 ? <Card><div className={styles.empty}>No webinars are currently listed for this mentor.</div></Card> : <div className={styles.webinarGrid}>{webinars.map(webinar => <Card key={webinar.id} interactive><div className={styles.webinarTop}><Tag>{webinar.status}</Tag>{webinar.date && <span>{new Date(webinar.date).toLocaleDateString()}</span>}</div><h3>{webinar.title}</h3><p>{webinar.description || 'Join this webinar to learn directly from the mentor.'}</p><div className={styles.webinarFooter}>{webinar.duration && <span><Icon name="clock" size={14} /> {webinar.duration}</span>}{!isOwner && <Btn kind="primary" size="sm" disabled={!(webinar.registrationUrl || webinar.url)} onClick={() => { const url = webinar.registrationUrl || webinar.url; if (url) window.open(url, '_blank', 'noopener,noreferrer'); }}>Enroll</Btn>}</div>{isOwner && <div className={styles.webinarActions}><Btn kind="outline" size="sm" full onClick={() => setEditingWebinar(webinar)}>Edit</Btn><Btn kind="ghost" size="sm" full disabled={deletingWebinarId === webinar.id} onClick={() => void handleDeleteWebinar(webinar)}>{deletingWebinarId === webinar.id ? 'Deleting...' : 'Delete'}</Btn></div>}</Card>)}</div>}
        </section>
      </main>
      <aside><Card pad={24}><h3 className={styles.detailsTitle}>Mentor details</h3><Meta label="Connections" value={String(mentor.connectionCount || 0)} /><Meta label="Experience" value={`${mentor.years}+ years`} /><Meta label="Category" value={mentor.category} /><Meta label="Industry" value={mentor.industry || 'Not specified'} /><Meta label="Session rate" value={rate} />{mentor.user && <Meta label="Community profile" value={mentor.user} />}{!accepted && <div className={styles.book}><Btn kind={requested ? 'soft' : 'primary'} size="lg" full onClick={handleConnect} disabled={connecting || requested}>{connecting ? 'Sending...' : requested ? 'Request sent' : 'Connect with mentor'}</Btn></div>}</Card></aside>
    </div>
    <CreateWebinarModal key={editingWebinar?.id || 'closed'} isOpen={Boolean(editingWebinar)} webinar={editingWebinar} onClose={() => setEditingWebinar(null)} onCreated={refreshOwnedWebinars} />
  </div>;
}

function Meta({ label, value }: { label: string; value: string }) { return <div className={styles.meta}><span>{label}</span><strong>{value}</strong></div>; }
