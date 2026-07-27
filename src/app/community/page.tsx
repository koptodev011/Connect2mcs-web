'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Avatar, ImgPh, SectionHead, PageHeader, useGlobalToast } from '@/components/primitives';
import { communityStats, memberGradients, groups as initialGroups, communityPeople as initialPeople } from '@/data/community';
import { CreateGroupModal } from '@/components/FormModals';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, collection, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const cats = ['All members', 'My network', 'Mentors', 'Authors', 'Artists', 'Founders', 'Students'];

export default function CommunityPage() {
  const [activeCat, setActiveCat] = useState(cats[0]);
  const [peopleData, setPeopleData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const router = useRouter();
  const [sortGroup, setSortGroup] = useState('Trending');
  const [sortMember, setSortMember] = useState('Relevance');
  const toast = useGlobalToast();

  const [groupsData, setGroupsData] = useState<any[]>([]);
  const [groupRequests, setGroupRequests] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        const saved = localStorage.getItem('mcs_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCurrentUser({ uid: parsed.name, email: parsed.name + '@connect2mcs.com', displayName: parsed.name });
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Load members from Firestore (with fallback)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs
        .map(d => d.data())
        .filter(data => data && data.uid && data.name);
      
      const merged = [...list];
      for (const p of initialPeople) {
        if (!merged.some(x => x.name.toLowerCase() === p.name.toLowerCase())) {
          merged.push({
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
          });
        }
      }
      setPeopleData(merged);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore users listener error:", err);
      setPeopleData(initialPeople.map(p => ({
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
      })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Load & sync groups in real-time from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'groups'), async (snapshot) => {
      if (snapshot.empty) {
        for (const g of initialGroups) {
          await setDoc(doc(db, 'groups', g.name), {
            id: g.name,
            name: g.name,
            description: 'Regional Mandal Community',
            address: 'Worldwide',
            members: [],
            adminId: 'Administrator',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } else {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setGroupsData(list);
      }
    });
    return () => unsubscribe();
  }, []);

  // 4. Sync Connection Requests and Connections in real-time
  useEffect(() => {
    if (!currentUser) return;
    const unsubConn = onSnapshot(collection(db, 'connections'), (snap) => {
      setConnections(snap.docs.map(d => d.data()));
    });
    const unsubConnReq = onSnapshot(collection(db, 'connectionRequests'), (snap) => {
      setConnectionRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubGroupReq = onSnapshot(collection(db, 'groupRequests'), (snap) => {
      setGroupRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubConn();
      unsubConnReq();
      unsubGroupReq();
    };
  }, [currentUser]);

  // Status computation helpers
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

  function getGroupStatus(group: any) {
    if (!currentUser) return 'join';
    const myUid = currentUser.uid;
    if (group.members?.includes(myUid)) return 'chat';
    const pending = groupRequests.some(r => r.userId === myUid && r.groupId === group.id && r.status === 'pending');
    if (pending) return 'pending';
    return 'join';
  }

  const handleJoinGroup = async (group: any) => {
    if (!currentUser) {
      toast.add('Please sign in to join groups', 'error');
      return;
    }
    try {
      await addDoc(collection(db, 'groupRequests'), {
        groupId: group.id,
        groupName: group.name,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.uid,
        userEmail: currentUser.email || '',
        status: 'pending',
        createdAt: new Date()
      });
      toast.add(`Request to join "${group.name}" sent!`, 'success');
    } catch (err) {
      console.error(err);
      toast.add('Failed to submit request', 'error');
    }
  };

  const handleConnect = async (targetUid: string, targetName: string) => {
    if (!currentUser) {
      toast.add('Please sign in to connect', 'error');
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
  };

  const handleAccept = async (targetUid: string, targetName: string) => {
    if (!currentUser) return;
    const myUid = currentUser.uid;
    try {
      const req = connectionRequests.find(r => r.senderId === targetUid && r.receiverId === myUid && r.status === 'pending');
      if (req?.id) {
        await updateDoc(doc(db, 'connectionRequests', req.id), { status: 'accepted', updatedAt: new Date() });
      }
      await addDoc(collection(db, 'connections'), { userId1: myUid, userId2: targetUid, createdAt: new Date() });
      toast.add(`Connected with ${targetName}!`, 'success');
    } catch (err) {
      console.error(err);
      toast.add('Failed to accept connection', 'error');
    }
  };

  const otherUsers = peopleData.filter(u => currentUser && u.uid !== currentUser.uid);

  const displayUsers = otherUsers.filter(u => {
    if (activeCat === 'My network') {
      return getConnectionStatus(u.uid) === 'connected';
    } else if (activeCat === 'Mentors') {
      return u.description?.toLowerCase().includes('mentor') || u.isMentor;
    } else if (activeCat === 'Authors') {
      return u.description?.toLowerCase().includes('author');
    } else if (activeCat === 'Artists') {
      return u.description?.toLowerCase().includes('dancer') || u.description?.toLowerCase().includes('artist') || u.description?.toLowerCase().includes('singer');
    } else if (activeCat === 'Founders') {
      return u.description?.toLowerCase().includes('founder') || u.description?.toLowerCase().includes('ceo') || u.userType === 'J';
    } else if (activeCat === 'Students') {
      return u.userType === 'S' || u.description?.toLowerCase().includes('student');
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Community"
        marathi="समुदाय"
        subtitle={`${loading ? '...' : peopleData.length} members · ${groupsData.length} active groups · 6,200+ mentors offering time`}
        actions={<>
          <Btn kind="ghost" size="md" iconL="chat" onClick={() => router.push('/chat')}>Open chat</Btn>
          <Btn kind="dark" size="md" iconL="plus" onClick={() => setNewGroupOpen(true)}>New group</Btn>
        </>}
      />

      <div className="mob-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {communityStats.map((s, i) => (
          <Card key={i} pad={20}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.ic} size={18} color={s.tone}/>
              </div>
              <span style={{ fontSize: 11, color: C.ink3, fontWeight: 600 }}>{s.s}</span>
            </div>
            <div className="num" style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: C.ink }}>{s.k}</div>
            <div style={{ fontSize: 12.5, color: C.ink3, fontWeight: 600, marginTop: 4 }}>{s.l}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
        {cats.map(c => <Pill key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</Pill>)}
      </div>

      <section>
        <SectionHead 
          title="Trending groups" 
          subtitle="Active discussions in the last 24 hours" 
          action={
            <select value={sortGroup} onChange={e => setSortGroup(e.target.value)} style={{ appearance: 'none', background: 'transparent', border: 'none', color: C.saffronDk, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
              <option value="Trending">Sort: Trending</option>
              <option value="Members">Sort: Members</option>
            </select>
          }
        />
        <div className="mob-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {groupsData.map((g) => {
            const status = getGroupStatus(g);
            return (
              <Card key={g.id} pad={0} interactive style={{ overflow: 'hidden' }}>
                <Link href={status === 'chat' ? `/community/group-chat/${g.id}` : `/community`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <ImgPh kind={g.kind || 'group'} height={90} tone={g.tone || 'saffron'}/>
                  <div style={{ padding: '14px 16px 0' }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em' }}>{g.name}</div>
                    <div style={{ fontSize: 12, color: C.ink3, marginTop: 3, fontWeight: 500 }}>{(g.members?.length || 0).toLocaleString()} members</div>
                  </div>
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '0 16px 14px' }}>
                  <span style={{ fontSize: 11.5, color: C.green, fontWeight: 600 }}>{g.posts || 'Active'}</span>
                  {status === 'chat' ? (
                    <Btn kind="soft" size="sm" onClick={() => router.push(`/community/group-chat/${g.id}`)}>Chat</Btn>
                  ) : status === 'pending' ? (
                    <Btn kind="outline" size="sm" disabled>Requested</Btn>
                  ) : (
                    <Btn kind="outline" size="sm" onClick={() => handleJoinGroup(g)}>Join</Btn>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHead 
          title="Members" 
          subtitle="Filtered by your network and interests" 
          action={
            <select value={sortMember} onChange={e => setSortMember(e.target.value)} style={{ appearance: 'none', background: 'transparent', border: 'none', color: C.saffronDk, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
              <option value="Relevance">Sort: Relevance</option>
              <option value="Newest">Sort: Newest</option>
            </select>
          }
        />
        <div className="mob-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {loading ? (
            <div style={{ padding: 20, color: C.ink3 }}>Loading members...</div>
          ) : (
            displayUsers.map((p, i) => {
              const status = getConnectionStatus(p.uid);
              return (
                <Link key={p.uid} href={`/community/member-details/${p.uid}`} style={{ textDecoration: 'none' }}>
                  <Card pad={0} interactive style={{ overflow: 'hidden' }}>
                    <div style={{ height: 60, background: `linear-gradient(135deg, ${memberGradients[i % 4][0]}, ${memberGradients[i % 4][1]})` }}/>
                    <div style={{ padding: '0 18px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-block', position: 'relative' }}>
                        <Avatar name={p.name} size={68} style={{ margin: '-34px auto 10px', fontSize: 24, border: '3px solid #fff' }}/>
                        {p.is_online && (
                          <span style={{ position: 'absolute', bottom: 12, right: 2, width: 12, height: 12, background: C.green, border: '2px solid #fff', borderRadius: '50%' }} />
                        )}
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, letterSpacing: '-0.005em' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.ink3, marginTop: 3, fontWeight: 500, lineHeight: 1.35, height: 32, overflow: 'hidden' }}>{p.description || p.role}</div>
                      <div style={{ fontSize: 10.5, color: C.ink4, marginTop: 6, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{p.city} · {p.mandalIdentifier || p.mandal}</div>
                      <div style={{ marginTop: 10, fontSize: 11.5, color: C.green, fontWeight: 600 }}>
                        Open to <span style={{ color: C.ink, fontWeight: 700 }}>{p.userType === 'S' ? 'studying' : p.userType === 'J' ? 'mentoring' : 'networking'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                        {status === 'connected' ? (
                          <>
                            <Btn kind="soft" size="sm" disabled style={{ flex: 1 }}>
                              Connected ✓
                            </Btn>
                            <Btn kind="outline" size="sm" onClick={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              const sortedParticipants = [currentUser.uid, p.uid].sort();
                              const chatId = sortedParticipants.join('_and_');
                              router.push(`/chat/${chatId}`); 
                            }}>
                              <Icon name="chat" size={14}/>
                            </Btn>
                          </>
                        ) : status === 'request_sent' ? (
                          <Btn kind="outline" size="sm" disabled style={{ flex: 1 }}>
                            Requested
                          </Btn>
                        ) : status === 'request_received' ? (
                          <Btn kind="primary" size="sm" style={{ flex: 1 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAccept(p.uid, p.name); }}>
                            Accept
                          </Btn>
                        ) : (
                          <Btn kind="primary" size="sm" style={{ flex: 1 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConnect(p.uid, p.name); }}>
                            + Connect
                          </Btn>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </section>

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <Link href="/community/browse-members" style={{ textDecoration: 'none' }}>
          <Btn kind="outline" size="md">
            View All Members Directory
          </Btn>
        </Link>
      </div>

      <CreateGroupModal isOpen={newGroupOpen} onClose={() => setNewGroupOpen(false)}/>
    </div>
  );
}
