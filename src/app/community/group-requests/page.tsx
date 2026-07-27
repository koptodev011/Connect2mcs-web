'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { C } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, PageHeader, useGlobalToast } from '@/components/primitives';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function GroupRequestsPage() {
  const router = useRouter();
  const toast = useGlobalToast();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        const saved = localStorage.getItem('mcs_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCurrentUser({ uid: parsed.name, displayName: parsed.name, email: parsed.name + '@connect2mcs.com' });
          } catch {
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Load Admin Groups & Requests
  useEffect(() => {
    if (!currentUser) return;

    // Load groups to check admin rights
    const unsubGroups = onSnapshot(collection(db, 'groups'), (groupSnap) => {
      const allGroups = groupSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const adminGroups = allGroups.filter((g: any) => g.adminId === currentUser.uid);
      setGroups(adminGroups);
    }, (err) => console.warn(err));

    // Load all pending group requests
    const unsubReqs = onSnapshot(collection(db, 'groupRequests'), (reqSnap) => {
      const allReqs = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(allReqs);
      setLoading(false);
    }, (err) => {
      console.warn(err);
      setLoading(false);
    });

    return () => {
      unsubGroups();
      unsubReqs();
    };
  }, [currentUser]);

  // Filter requests belonging to the groups this user admins
  const adminGroupIds = groups.map(g => g.id);
  const pendingRequests = requests.filter(r => adminGroupIds.includes(r.groupId) && r.status === 'pending');

  // Accept Join Request
  async function handleAccept(reqId: string, groupId: string, userId: string, userName: string, groupName: string) {
    try {
      // 1. Update status
      await updateDoc(doc(db, 'groupRequests', reqId), {
        status: 'accepted'
      });

      // 2. Add user to group members array
      await updateDoc(doc(db, 'groups', groupId), {
        members: arrayUnion(userId)
      });

      toast.add(`Approved ${userName} to join ${groupName}!`, 'success');
    } catch (err) {
      console.error(err);
      toast.add('Failed to approve request', 'error');
    }
  }

  // Reject Join Request
  async function handleReject(reqId: string, userName: string, groupName: string) {
    try {
      await updateDoc(doc(db, 'groupRequests', reqId), {
        status: 'rejected'
      });
      toast.add(`Rejected ${userName}'s request for ${groupName}`, 'info');
    } catch (err) {
      console.error(err);
      toast.add('Failed to reject request', 'error');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800, margin: '0 auto' }}>
      <PageHeader
        title="Join Requests"
        marathi="प्रवेश विनंत्या"
        subtitle="Manage pending membership requests for your groups"
        actions={
          <Btn kind="outline" size="md" iconL="arrowLeft" onClick={() => router.push('/community')}>
            Back to Hub
          </Btn>
        }
      />

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.ink3 }}>Loading requests...</div>
      ) : pendingRequests.length === 0 ? (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ marginBottom: 12 }}>
            <Icon name="verify" size={32} color={C.green} />
          </div>
          <h3 style={{ margin: 0, color: C.ink }}>All caught up!</h3>
          <p style={{ margin: '4px 0 0', color: C.ink3, fontSize: 13.5 }}>There are no pending join requests for your groups.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pendingRequests.map(r => (
            <Card key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }} className="mob-stack">
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink }}>
                  {r.userName} <span style={{ fontWeight: 500, color: C.ink3, fontSize: 13.5 }}>requested to join</span> {r.groupName}
                </h4>
                <div style={{ fontSize: 12, color: C.ink3, marginTop: 4 }}>
                  Email: {r.userEmail || 'N/A'} · Requested on {r.createdAt ? new Date(r.createdAt.seconds * 1000 || r.createdAt).toLocaleDateString() : 'recently'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }} className="mob-full">
                <Btn kind="primary" size="sm" onClick={() => handleAccept(r.id, r.groupId, r.userId, r.userName, r.groupName)}>
                  Accept
                </Btn>
                <Btn kind="outline" size="sm" onClick={() => handleReject(r.id, r.userName, r.groupName)}>
                  Reject
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
