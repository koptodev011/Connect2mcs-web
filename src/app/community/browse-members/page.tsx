'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Avatar, Tag, PageHeader, useGlobalToast } from '@/components/primitives';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, query, where, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { communityPeople as initialPeople } from '@/data/community';

export default function BrowseMembersPage() {
  const router = useRouter();
  const toast = useGlobalToast();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'S' | 'E' | 'J' | 'M'>('all');

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

  // 2. Load Users
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list = snapshot.docs
        .map(d => d.data())
        .filter(data => data && data.uid && data.name);

      // Merge with initial community people
      const merged = [...list];
      for (const p of initialPeople) {
        if (!merged.some(x => x.name.toLowerCase() === p.name.toLowerCase())) {
          // Map mock data properties to the collection schema
          const mappedMock = {
            uid: p.name,
            name: p.name,
            displayName: p.name,
            email: p.name.replace(/\s+/g, '').toLowerCase() + '@connect2mcs.com',
            userType: p.role?.toLowerCase().includes('student') ? 'S' : 
                      p.role?.toLowerCase().includes('founder') || p.role?.toLowerCase().includes('ceo') || p.role?.toLowerCase().includes('entrepreneur') ? 'J' : 'E',
            description: p.role || 'Member of MCS',
            city: p.city || 'Unknown',
            mandalIdentifier: p.mandal || 'General',
            is_online: true
          };
          merged.push(mappedMock);
        }
      }
      setUsersList(merged);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore users load failed, using mock data:", error);
      // Fallback
      const fallback = initialPeople.map(p => ({
        uid: p.name,
        name: p.name,
        displayName: p.name,
        email: p.name.replace(/\s+/g, '').toLowerCase() + '@connect2mcs.com',
        userType: p.role?.toLowerCase().includes('student') ? 'S' : 
                  p.role?.toLowerCase().includes('founder') || p.role?.toLowerCase().includes('ceo') || p.role?.toLowerCase().includes('entrepreneur') ? 'J' : 'E',
        description: p.role || 'Member of MCS',
        city: p.city || 'Unknown',
        mandalIdentifier: p.mandal || 'General',
        is_online: false
      }));
      setUsersList(fallback);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Load Connections
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, 'connections'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setConnections(list);
    }, (err) => console.warn(err));
    return () => unsubscribe();
  }, [currentUser]);

  // 4. Load Connection Requests
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, 'connectionRequests'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setConnectionRequests(list);
    }, (err) => console.warn(err));
    return () => unsubscribe();
  }, [currentUser]);

  // Helper: Get Connection Status for a member
  function getConnectionStatus(targetUid: string) {
    if (!currentUser) return 'not_connected';
    const myUid = currentUser.uid;

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

  // Action: Connect
  async function handleConnect(targetUid: string, targetName: string) {
    if (!currentUser) {
      toast.add('Please log in to connect', 'error');
      return;
    }
    try {
      await addDoc(collection(db, 'connectionRequests'), {
        senderId: currentUser.uid,
        receiverId: targetUid,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      toast.add(`Connection request sent to ${targetName}`, 'success');
    } catch (err) {
      console.error(err);
      toast.add('Failed to send request', 'error');
    }
  }

  // Action: Accept Request
  async function handleAccept(targetUid: string, targetName: string) {
    if (!currentUser) return;
    const myUid = currentUser.uid;

    try {
      // 1. Find and update the request
      const req = connectionRequests.find(r => r.senderId === targetUid && r.receiverId === myUid && r.status === 'pending');
      if (req && req.id) {
        await updateDoc(doc(db, 'connectionRequests', req.id), {
          status: 'accepted',
          updatedAt: new Date()
        });
      }

      // 2. Add connection
      await addDoc(collection(db, 'connections'), {
        userId1: myUid,
        userId2: targetUid,
        createdAt: new Date()
      });

      // 3. Create chat document
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
          [targetUid]: { name: targetName, email: targetName.replace(/\s+/g, '').toLowerCase() + '@connect2mcs.com' }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.add(`You are now connected with ${targetName}!`, 'success');
    } catch (err) {
      console.error(err);
      toast.add('Failed to accept request', 'error');
    }
  }

  // Filter members list
  const filteredUsers = usersList.filter(user => {
    // Hide self
    if (currentUser && user.uid === currentUser.uid) return false;

    // Search query matching
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter matching
    if (activeTab === 'all') return true;
    if (activeTab === 'M') {
      // Mentor if role includes 'mentor' or they are marked as mentor
      return user.description?.toLowerCase().includes('mentor') || user.isMentor;
    }
    return user.userType === activeTab;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Directory"
        marathi="सदस्य संचिका"
        subtitle="Browse and connect with Marathi community members worldwide"
        actions={
          <Btn kind="outline" size="md" iconL="arrowLeft" onClick={() => router.push('/community')}>
            Back to Hub
          </Btn>
        }
      />

      {/* Search & Tabs */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.bgDeep, borderRadius: 10 }}>
            <Icon name="search" size={16} color={C.ink3} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, city..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { id: 'all', label: 'All Members' },
              { id: 'S', label: 'Students' },
              { id: 'E', label: 'Employees' },
              { id: 'J', label: 'Entrepreneurs' },
              { id: 'M', label: 'Mentors' },
            ].map(tab => {
              const isSel = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: isSel ? C.saffron : C.bgDeep,
                    color: isSel ? '#fff' : C.ink2,
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Directory Grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.ink3 }}>Loading directory...</div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 12, border: `1px solid ${C.line}` }}>
          <div style={{ marginBottom: 12 }}>
            <Icon name="people" size={40} color={C.ink4} />
          </div>
          <h3 style={{ margin: 0, color: C.ink }}>No members found</h3>
          <p style={{ margin: '4px 0 0', color: C.ink3, fontSize: 13 }}>Try adjusting your tabs or search criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredUsers.map(u => {
            const status = getConnectionStatus(u.uid);
            return (
              <Card key={u.uid} className="card-int" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar name={u.name} size={48} />
                      {u.is_online && (
                        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, background: C.green, border: '2px solid #fff', borderRadius: '50%' }} />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.name}
                      </h4>
                      <div style={{ fontSize: 11, color: C.ink3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="pin" size={10} color={C.ink3} />
                        {u.city || 'Location N/A'}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 12.5, color: C.ink2, marginTop: 12, minHeight: 36, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.description}
                  </p>

                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                    <Tag color={u.userType === 'S' ? C.blue : u.userType === 'J' ? C.saffron : C.green} bg="#fff" style={{ border: `1px solid ${C.line}` }}>
                      {u.userType === 'S' ? 'Student' : u.userType === 'J' ? 'Entrepreneur' : 'Employee'}
                    </Tag>
                    {u.mandalIdentifier && (
                      <Tag color={C.gold} bg="#fff" style={{ border: `1px solid ${C.line}` }}>
                        {u.mandalIdentifier}
                      </Tag>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16, borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
                  <Link href={`/community/member-details/${u.uid}`} style={{ gridColumn: 'span 2', textDecoration: 'none' }}>
                    <Btn kind="ghost" size="sm" style={{ width: '100%', marginBottom: 4 }}>
                      View Profile
                    </Btn>
                  </Link>

                  {status === 'connected' ? (
                    <>
                      <Btn kind="outline" size="sm" disabled style={{ color: C.green }}>
                        <span style={{ marginRight: 4, display: 'inline-flex', alignItems: 'center' }}><Icon name="verify" size={12} /></span> Connected
                      </Btn>
                      <Link href={`/chat?user=${encodeURIComponent(u.name)}`} style={{ textDecoration: 'none' }}>
                        <Btn kind="primary" size="sm" style={{ width: '100%' }}>
                          Message
                        </Btn>
                      </Link>
                    </>
                  ) : status === 'request_sent' ? (
                    <Btn kind="outline" size="sm" disabled style={{ gridColumn: 'span 2' }}>
                      Request Sent
                    </Btn>
                  ) : status === 'request_received' ? (
                    <>
                      <Btn kind="primary" size="sm" onClick={() => handleAccept(u.uid, u.name)}>
                        Accept
                      </Btn>
                      <Btn kind="outline" size="sm" disabled>
                        Pending
                      </Btn>
                    </>
                  ) : (
                    <Btn kind="outline" size="sm" style={{ gridColumn: 'span 2' }} onClick={() => handleConnect(u.uid, u.name)}>
                      Connect
                    </Btn>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
