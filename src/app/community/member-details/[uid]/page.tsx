'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Avatar, Tag, PageHeader, useGlobalToast } from '@/components/primitives';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, query, where, setDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { communityPeople as initialPeople } from '@/data/community';

export default function MemberDetailsPage({ params }: { params: Promise<{ uid: string }> }) {
  const resolvedParams = use(params);
  const uid = resolvedParams.uid;

  const router = useRouter();
  const toast = useGlobalToast();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [member, setMember] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Auth Listener
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

  // 2. Load Member Details
  useEffect(() => {
    if (!uid) return;

    const docRef = doc(db, 'users', uid);
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        setMember({ uid: docSnap.id, ...docSnap.data() });
        setLoading(false);
      } else {
        // Fallback to searching mock initialPeople by name/uid
        const mockPerson = initialPeople.find(p => p.name.toLowerCase() === uid.toLowerCase() || p.name === uid);
        if (mockPerson) {
          setMember({
            uid: mockPerson.name,
            name: mockPerson.name,
            displayName: mockPerson.name,
            email: mockPerson.name.replace(/\s+/g, '').toLowerCase() + '@connect2mcs.com',
            userType: mockPerson.role?.toLowerCase().includes('student') ? 'S' : 
                      mockPerson.role?.toLowerCase().includes('founder') || mockPerson.role?.toLowerCase().includes('ceo') || mockPerson.role?.toLowerCase().includes('entrepreneur') ? 'J' : 'E',
            description: mockPerson.role || 'Member of MCS',
            city: mockPerson.city || 'Unknown',
            mandalIdentifier: mockPerson.mandal || 'General',
            is_online: false
          });
        }
        setLoading(false);
      }
    }).catch(err => {
      console.warn("Failed to load user from Firestore, checking mock details:", err);
      const mockPerson = initialPeople.find(p => p.name.toLowerCase() === uid.toLowerCase() || p.name === uid);
      if (mockPerson) {
        setMember({
          uid: mockPerson.name,
          name: mockPerson.name,
          displayName: mockPerson.name,
          email: mockPerson.name.replace(/\s+/g, '').toLowerCase() + '@connect2mcs.com',
          userType: mockPerson.role?.toLowerCase().includes('student') ? 'S' : 
                    mockPerson.role?.toLowerCase().includes('founder') || mockPerson.role?.toLowerCase().includes('ceo') || mockPerson.role?.toLowerCase().includes('entrepreneur') ? 'J' : 'E',
          description: mockPerson.role || 'Member of MCS',
          city: mockPerson.city || 'Unknown',
          mandalIdentifier: mockPerson.mandal || 'General',
          is_online: false
        });
      }
      setLoading(false);
    });
  }, [uid]);

  // 3. Load Connections & Requests
  useEffect(() => {
    if (!currentUser) return;
    const unsubConn = onSnapshot(collection(db, 'connections'), (snapshot) => {
      setConnections(snapshot.docs.map(d => d.data()));
    });
    const unsubReq = onSnapshot(collection(db, 'connectionRequests'), (snapshot) => {
      setConnectionRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubConn();
      unsubReq();
    };
  }, [currentUser]);

  // Helper: Get Connection Status
  function getConnectionStatus() {
    if (!currentUser || !member) return 'not_connected';
    const myUid = currentUser.uid;
    const targetUid = member.uid;

    const isConnected = connections.some(c => 
      (c.userId1 === myUid && c.userId2 === targetUid) || 
      (c.userId2 === myUid && c.userId1 === targetUid)
    );
    if (isConnected) return 'connected';

    const sentReq = connectionRequests.find(r => r.senderId === myUid && r.receiverId === targetUid && r.status === 'pending');
    if (sentReq) return 'request_sent';

    const receivedReq = connectionRequests.find(r => r.senderId === targetUid && r.receiverId === myUid && r.status === 'pending');
    if (receivedReq) return 'request_received';

    return 'not_connected';
  }

  // Connect action
  async function handleConnect() {
    if (!currentUser || !member) return;
    try {
      await addDoc(collection(db, 'connectionRequests'), {
        senderId: currentUser.uid,
        receiverId: member.uid,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      toast.add(`Connection request sent to ${member.name}`, 'success');
    } catch (err) {
      console.error(err);
      toast.add('Failed to send request', 'error');
    }
  }

  // Accept action
  async function handleAccept() {
    if (!currentUser || !member) return;
    const myUid = currentUser.uid;
    const targetUid = member.uid;

    try {
      const req = connectionRequests.find(r => r.senderId === targetUid && r.receiverId === myUid && r.status === 'pending');
      if (req && req.id) {
        await updateDoc(doc(db, 'connectionRequests', req.id), {
          status: 'accepted',
          updatedAt: new Date()
        });
      }

      await addDoc(collection(db, 'connections'), {
        userId1: myUid,
        userId2: targetUid,
        createdAt: new Date()
      });

      const sortedParticipants = [myUid, targetUid].sort();
      const chatId = sortedParticipants.join('_and_');
      await setDoc(doc(db, 'chats', chatId), {
        id: chatId,
        participants: sortedParticipants,
        lastMessage: 'You are now connected! Say hi.',
        lastMessageTime: new Date(),
        lastMessageSenderId: myUid,
        unreadCount: { [myUid]: 0, [targetUid]: 0 },
        deletedBy: { [myUid]: false, [targetUid]: false },
        lastSeenBy: { [myUid]: new Date(), [targetUid]: new Date() },
        memberDetails: {
          [myUid]: { name: currentUser.displayName || currentUser.uid, email: currentUser.email || '' },
          [targetUid]: { name: member.name, email: member.email || '' }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.add(`Connected with ${member.name}!`, 'success');
    } catch (err) {
      console.error(err);
      toast.add('Failed to accept connection', 'error');
    }
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: C.ink3 }}>Loading member profile...</div>;
  }

  if (!member) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h3 style={{ color: C.ink }}>Member not found</h3>
        <Btn kind="dark" size="md" style={{ marginTop: 16 }} onClick={() => router.push('/community/browse-members')}>
          Back to Directory
        </Btn>
      </div>
    );
  }

  const status = getConnectionStatus();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Member Profile"
        marathi="सदस्य तपशील"
        subtitle={`Viewing profile details for ${member.name}`}
        actions={
          <Btn kind="outline" size="md" iconL="arrowLeft" onClick={() => router.push('/community/browse-members')}>
            Back to Directory
          </Btn>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }} className="mob-stack">
        {/* Left Column: Avatar Card & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ position: 'relative' }}>
              <Avatar name={member.name} size={112} style={{ fontSize: 36 }} />
              {member.is_online && (
                <span style={{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, background: C.green, border: '3px solid #fff', borderRadius: '50%' }} />
              )}
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginTop: 16, marginBottom: 4 }}>{member.name}</h2>
            <div style={{ fontSize: 13, color: C.ink2, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
              <Icon name="pin" size={13} color={C.ink3} />
              {member.city || 'Unknown City'}
            </div>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
              <Tag color={member.userType === 'S' ? C.blue : member.userType === 'J' ? C.saffron : C.green} bg={C.bgDeep}>
                {member.userType === 'S' ? 'Student' : member.userType === 'J' ? 'Entrepreneur' : 'Employee'}
              </Tag>
              {member.mandalIdentifier && (
                <Tag color={C.gold} bg={C.bgDeep}>
                  {member.mandalIdentifier}
                </Tag>
              )}
            </div>

            {/* Actions list */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24, borderTop: `1px solid ${C.line}`, paddingTop: 20 }}>
              {status === 'connected' ? (
                <>
                  <Btn kind="outline" size="md" disabled style={{ color: C.green, width: '100%' }}>
                    <span style={{ marginRight: 6, display: 'inline-flex', alignItems: 'center' }}><Icon name="verify" size={14} /></span> Connected
                  </Btn>
                  <Link href={`/chat?user=${encodeURIComponent(member.name)}`} style={{ textDecoration: 'none' }}>
                    <Btn kind="primary" size="md" style={{ width: '100%' }}>
                      Send Message
                    </Btn>
                  </Link>
                </>
              ) : status === 'request_sent' ? (
                <Btn kind="outline" size="md" disabled style={{ width: '100%' }}>
                  Request Sent
                </Btn>
              ) : status === 'request_received' ? (
                <>
                  <Btn kind="primary" size="md" style={{ width: '100%' }} onClick={handleAccept}>
                    Accept Connection
                  </Btn>
                  <Btn kind="outline" size="md" disabled style={{ width: '100%' }}>
                    Pending Request
                  </Btn>
                </>
              ) : (
                <Btn kind="outline" size="md" style={{ width: '100%' }} onClick={handleConnect}>
                  Connect
                </Btn>
              )}

              <Btn
                kind="ghost"
                size="md"
                style={{ width: '100%', color: C.ink3 }}
                onClick={() => {
                  toast.add(`Mentorship request sent to ${member.name}!`, 'success');
                }}
              >
                Request Mentorship
              </Btn>
            </div>
          </Card>
        </div>

        {/* Right Column: Profile Info Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* About */}
          <Card>
            <h3 style={{ margin: '0 0 12px', color: C.ink, fontSize: 16, fontWeight: 700 }}>About</h3>
            <p style={{ margin: 0, color: C.ink2, fontSize: 14.5, lineHeight: 1.6 }}>
              {member.description || 'No custom description provided yet.'}
            </p>
          </Card>

          {/* Professional Details */}
          <Card>
            <h3 style={{ margin: '0 0 16px', color: C.ink, fontSize: 16, fontWeight: 700 }}>Professional Info</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="mob-stack">
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Organization</label>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 4 }}>{member.orgName || 'N/A'}</div>
              </div>
              
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Mandal Association</label>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 4 }}>{member.mandalIdentifier || 'General Mandal'}</div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Business Partner ID</label>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 4 }}>{member.businessPartnerIdentifier || 'Not Provided'}</div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Last Active</label>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 4 }}>
                  {member.is_online ? 'Active now' : member.lastSeen ? new Date(member.lastSeen.seconds * 1000 || member.lastSeen).toLocaleString() : 'Recently'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
