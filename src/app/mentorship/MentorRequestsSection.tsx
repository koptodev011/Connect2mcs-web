'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Btn, Card, SectionHead, useGlobalToast } from '@/components/primitives';
import styles from './page.module.css';

type MentorRequest = { id: string; name: string; userId: string; status: string; created: string };

export default function MentorRequestsSection() {
  const [requests, setRequests] = useState<MentorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const router = useRouter();
  const toast = useGlobalToast();

  useEffect(() => {
    const token = localStorage.getItem('mcs_token');

    fetch('/api/mentorship/requests?received=true', { headers: { Authorization: 'Bearer ' + token } })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not load mentorship requests'); return data; })
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .catch(error => setLoadError(error instanceof Error ? error.message : 'Could not load mentorship requests.'))
      .finally(() => setLoading(false));
  }, []);

  const update = async (requestId: string, status: 'A' | 'R') => {
    const token = localStorage.getItem('mcs_token');
    if (!token) { router.push('/login'); return; }
    setUpdatingId(requestId);
    try {
      const response = await fetch('/api/mentorship/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ requestId: Number(requestId), status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update request');
      setRequests(current => current.filter(item => item.id !== requestId));
      toast.add(status === 'A' ? 'Mentorship request accepted.' : 'Mentorship request rejected.', 'success');
    } catch (error) {
      toast.add(error instanceof Error ? error.message : 'Could not update request.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = requests.filter(request => request.status === 'P').length;
//   return <section>
//     <SectionHead title="Mentorship requests" subtitle={loading ? 'Loading requests...' : `${pendingCount} pending requests`}/>
//     {loading ? <Card><div className={styles.myMentorsEmpty}>Loading mentorship requests...</div></Card>
//       : loadError ? <Card><div className={styles.myMentorsEmpty}>{loadError}</div></Card>
//       : requests.length === 0 ? <Card><div className={styles.myMentorsEmpty}>No mentorship requests received yet.</div></Card>
//       : <div className={styles.myMentorsGrid}>
//         {requests.map(request => <Card key={request.id} className={styles.myMentorCard}>
//           <Avatar name={request.name} size={44}/>
//           <div className={styles.myMentorInfo}>
//             <strong>{request.name}</strong>
//             <span>{request.created ? new Date(request.created).toLocaleDateString() : 'Mentorship request'}</span>
//             <small>{request.status === 'A' ? 'Accepted' : request.status === 'R' ? 'Rejected' : 'Pending'}</small>
//           </div>
//           {request.status === 'P' && <div style={{ display: 'flex', gap: 8 }}>
//             <Btn kind="primary" size="sm" disabled={updatingId === request.id} onClick={() => void update(request.id, 'A')}>Accept</Btn>
//             <Btn kind="ghost" size="sm" disabled={updatingId === request.id} onClick={() => void update(request.id, 'R')}>Reject</Btn>
//           </div>}
//         </Card>)}
//       </div>}
//   </section>;
}
