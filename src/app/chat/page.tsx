'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Avatar, Modal, Tag, PageHeader, useGlobalToast } from '@/components/primitives';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, updateDoc, query, where, getDoc, orderBy, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getOrCreateAccommodationChat } from '@/lib/accommodation-chat';

function ChatContent() {
  const router = useRouter();
  const toast = useGlobalToast();
  const searchParams = useSearchParams();
  const queryUser = searchParams.get('user');
  const chatSource = searchParams.get('source');
  const housingOwnerId = searchParams.get('ownerId') || '';
  const housingOwnerEmail = searchParams.get('email') || '';
  const housingPropertyId = searchParams.get('propertyId') || '';
  const housingPropertyTitle = searchParams.get('propertyTitle') || '';
  const housingPropertyPrice = searchParams.get('propertyPrice') || '';
  const housingPropertyLocation = searchParams.get('propertyLocation') || '';
  const taxiRequestId = searchParams.get('taxiRequestId');
  const taxiQuoteId = searchParams.get('taxiQuoteId');
  const taxiFare = searchParams.get('taxiFare');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [searchPeople, setSearchPeople] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taxiBookingOpen, setTaxiBookingOpen] = useState(false);
  const [taxiBooking, setTaxiBooking] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const housingChatStarted = useRef(false);

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

  // 2. Load Firestore Data
  useEffect(() => {
    if (!currentUser) return;
    const myUid = currentUser.uid;

    // A. Users Snapshot
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsersList(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });

    // B. Groups Snapshot (joined groups only)
    const unsubGroups = onSnapshot(collection(db, 'groups'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const joined = list.filter((g: any) => g.members?.includes(myUid));
      setGroups(joined);
    });

    // C. Chats Snapshot
    const qChats = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', myUid)
    );
    const unsubChats = onSnapshot(qChats, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Chats subscription error:", err.message);
    });

    // D. Connections Snapshot
    const unsubConn = onSnapshot(collection(db, 'connections'), (snap) => {
      setConnections(snap.docs.map(d => d.data()));
      setLoading(false);
    }, (err) => {
      console.warn(err);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubGroups();
      unsubChats();
      unsubConn();
    };
  }, [currentUser]);

  const queryChatId = searchParams.get('chatId');

  // 3. Handle query params (?chatId=) redirection
  useEffect(() => {
    if (queryChatId) {
      setActiveId(queryChatId);
    }
  }, [queryChatId]);

  // Shared-accommodation chat follows the mobile app schema: resolve the ERP
  // property owner to a Firebase user, then reuse or create a participant chat.
  useEffect(() => {
    if (
      chatSource !== 'housing' ||
      !currentUser ||
      !queryUser ||
      housingChatStarted.current
    ) {
      return;
    }

    housingChatStarted.current = true;
    getOrCreateAccommodationChat(currentUser, {
      ownerId: housingOwnerId,
      ownerName: queryUser,
      ownerEmail: housingOwnerEmail,
      propertyId: housingPropertyId,
      propertyTitle: housingPropertyTitle,
      propertyPrice: housingPropertyPrice,
      propertyLocation: housingPropertyLocation,
    })
      .then((chatId) => {
        setActiveId(chatId);
        router.replace(`/chat?chatId=${encodeURIComponent(chatId)}`);
      })
      .catch((error: unknown) => {
        housingChatStarted.current = false;
        toast.add(
          error instanceof Error ? error.message : 'Could not open property chat.',
          'error',
        );
      });
  }, [
    chatSource,
    currentUser,
    housingOwnerEmail,
    housingOwnerId,
    housingPropertyId,
    housingPropertyLocation,
    housingPropertyPrice,
    housingPropertyTitle,
    queryUser,
    router,
    toast,
  ]);

  // Handle query params (?user=) redirection
  useEffect(() => {
    if (chatSource === 'housing' || !queryUser || usersList.length === 0 || !currentUser) return;
    const targetUser = usersList.find(u =>
      String(u.name || u.displayName || '').toLowerCase() === queryUser.toLowerCase()
    );
    if (targetUser) {
      const sortedParticipants = [currentUser.uid, targetUser.uid].sort();
      const chatId = sortedParticipants.join('_and_');
      
      // Mobile creates random chat document IDs and identifies a direct chat by
      // its sorted participants. Match that schema before using the web fallback ID.
      const existing = chats.find(c =>
        Array.isArray(c.participants) &&
        [...c.participants].sort().join('|') === sortedParticipants.join('|')
      );
      if (existing) {
        setActiveId(existing.id);
      } else {
        const myUid = currentUser.uid;
        setDoc(doc(db, 'chats', chatId), {
          id: chatId,
          participants: sortedParticipants,
          lastMessage: 'Say hi to start the conversation!',
          lastMessageTime: new Date(),
          lastMessageSenderId: myUid,
          unreadCount: { [myUid]: 0, [targetUser.uid]: 0 },
          deletedBy: { [myUid]: false, [targetUser.uid]: false },
          lastSeenBy: { [myUid]: new Date(), [targetUser.uid]: new Date() },
          memberDetails: {
            [myUid]: { name: currentUser.displayName || currentUser.uid, email: currentUser.email || '' },
            [targetUser.uid]: { name: targetUser.name, email: targetUser.email || '' }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }).then(() => {
          setActiveId(chatId);
        });
      }
    }
  }, [chatSource, queryUser, usersList, currentUser, chats]);

  const confirmTaxiBooking = async () => {
    if (!taxiRequestId || !taxiQuoteId) return;
    let userId = 0;
    try { userId = Number(JSON.parse(localStorage.getItem('mcs_user') || '{}').id) || 0 } catch {}
    setTaxiBooking(true);
    try {
      const response = await fetch('/api/v1/models/MCS_Taxi_Service_Request', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, id: taxiRequestId, quoteId: taxiQuoteId, MCS_TripStatus: 'A', MCS_UserQuote: Number(taxiFare || 0) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not confirm taxi booking');
      setTaxiBookingOpen(false);
      toast.add(`Booking confirmed with ${queryUser || 'driver'}.`, 'success');
    } catch (error) { toast.add(error instanceof Error ? error.message : 'Could not confirm taxi booking', 'error'); }
    finally { setTaxiBooking(false); }
  };
  // Build unified conversation sidebar items
  const groupConversations = groups.map(g => ({
    id: g.id,
    name: g.name,
    isGroup: true,
    lastMessage: g.lastMessage || 'Welcome to the group chat!',
    lastMessageTime: g.lastMessageTime?.toDate ? g.lastMessageTime.toDate() : new Date(g.createdAt?.seconds * 1000 || Date.now()),
    unread: 0,
    online: true,
    mandal: g.address || 'Group Chat'
  }));

  const directConversations = chats.map(c => {
    const otherUid = c.participants.find((p: string) => p !== currentUser?.uid);
    const otherDetail = c.memberDetails?.[otherUid] || { name: 'Community Member' };
    const isOnline = usersList.find(u => u.uid === otherUid)?.is_online || false;
    const otherProfile = usersList.find(u => u.uid === otherUid);
    return {
      id: c.id,
      name: otherDetail.name,
      otherUid,
      isGroup: false,
      lastMessage: c.lastMessage || 'Say hi to start the conversation!',
      lastMessageTime: c.lastMessageTime?.toDate ? c.lastMessageTime.toDate() : new Date(c.createdAt?.seconds * 1000 || Date.now()),
      unread: c.unreadCount?.[currentUser?.uid] || 0,
      online: isOnline,
      mandal: otherProfile?.mandalIdentifier || 'Mandal Connection'
    };
  });

  const allConversations = [...groupConversations, ...directConversations].sort((a, b) => 
    b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
  );

  const filteredConvs = allConversations.filter(c =>
    !searchPeople || c.name.toLowerCase().includes(searchPeople.toLowerCase())
  );

  const activeConv = allConversations.find(c => c.id === activeId) || allConversations[0];

  // 4. Reset unread count & load messages for selected active conversation
  useEffect(() => {
    if (!currentUser || !activeConv) return;

    // Reset unread count for 1:1 direct chat if active
    if (!activeConv.isGroup) {
      const chatDocRef = doc(db, 'chats', activeConv.id);
      getDoc(chatDocRef).then((snap) => {
        if (snap.exists()) {
          const cData = snap.data();
          if (cData.unreadCount?.[currentUser.uid] > 0) {
            updateDoc(chatDocRef, {
              [`unreadCount.${currentUser.uid}`]: 0
            }).catch(console.error);
          }
        }
      });
    }

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', activeConv.id)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName || 'Anonymous',
          text: data.text,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp?.seconds * 1000 || Date.now()),
          at: data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
        };
      });
      list.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setMessages(list);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [activeConv?.id, currentUser]);

  // 5. Send message action
  async function sendMessage() {
    if (!draft.trim() || !currentUser || !activeConv) return;
    const myUid = currentUser.uid;
    const myName = currentUser.displayName || currentUser.uid;
    const msgText = draft.trim();
    setDraft('');

    const timestamp = new Date();
    const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      // Write message to the shared root messages collection
      await addDoc(collection(db, 'messages'), {
        chatId: activeConv.id,
        senderId: myUid,
        senderName: myName,
        text: msgText,
        timestamp
      });

      if (activeConv.isGroup) {
        await updateDoc(doc(db, 'groups', activeConv.id), {
          lastMessage: `${myName}: ${msgText}`,
          lastMessageTime: timestamp,
          updatedAt: timestamp
        });
      } else {
        const chatDocRef = doc(db, 'chats', activeConv.id);
        const chatSnap = await getDoc(chatDocRef);
        
        if (!chatSnap.exists()) {
          const sortedParticipants = activeConv.id.split('_and_');
          const otherUid = (activeConv as any).otherUid;
          await setDoc(chatDocRef, {
            id: activeConv.id,
            participants: sortedParticipants,
            lastMessage: msgText,
            lastMessageTime: timestamp,
            lastMessageSenderId: myUid,
            unreadCount: { [myUid]: 0, [otherUid]: 1 },
            deletedBy: { [myUid]: false, [otherUid]: false },
            lastSeenBy: { [myUid]: new Date(), [otherUid]: new Date() },
            memberDetails: {
              [myUid]: { name: currentUser.displayName || currentUser.uid, email: currentUser.email || '' },
              [otherUid]: { name: activeConv.name, email: activeConv.name.replace(/\s+/g, '').toLowerCase() + '@connect2mcs.com' }
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          const incrementKey = `unreadCount.${(activeConv as any).otherUid}`;
          await updateDoc(chatDocRef, {
            lastMessage: msgText,
            lastMessageTime: timestamp,
            lastMessageSenderId: myUid,
            [incrementKey]: increment(1),
            updatedAt: timestamp
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast.add('Failed to send message', 'error');
    }
  }

  // FAB / New Chat Modal actions
  const myFriends = connections.map(c => {
    const friendUid = c.userId1 === currentUser?.uid ? c.userId2 : c.userId1;
    const friendProfile = usersList.find(u => u.uid === friendUid);
    return {
      uid: friendUid,
      name: friendProfile?.name || 'Community Member',
      description: friendProfile?.description || 'Member of MCS'
    };
  });

  async function handleStartChat(friendUid: string, friendName: string) {
    if (!currentUser) return;
    const myUid = currentUser.uid;
    const sortedParticipants = [myUid, friendUid].sort();
    const chatId = sortedParticipants.join('_and_');

    try {
      const chatDocRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatDocRef);
      if (!chatSnap.exists()) {
        await setDoc(chatDocRef, {
          id: chatId,
          participants: sortedParticipants,
          lastMessage: 'Chat started.',
          lastMessageTime: new Date(),
          lastMessageSenderId: myUid,
          unreadCount: { [myUid]: 0, [friendUid]: 0 },
          deletedBy: { [myUid]: false, [friendUid]: false },
          lastSeenBy: { [myUid]: new Date(), [friendUid]: new Date() },
          memberDetails: {
            [myUid]: { name: currentUser.displayName || currentUser.uid, email: currentUser.email || '' },
            [friendUid]: { name: friendName, email: friendName.replace(/\s+/g, '').toLowerCase() + '@connect2mcs.com' }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      setActiveId(chatId);
      setNewChatOpen(false);
    } catch (err) {
      console.error(err);
      toast.add('Failed to initiate chat', 'error');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <PageHeader title="Chat" marathi="Ã Â¤Â¸Ã Â¤â€šÃ Â¤ÂµÃ Â¤Â¾Ã Â¤Â¦" subtitle="Real-time messaging with people you're connected to" />
        <div style={{ padding: 40, textAlign: 'center', color: C.ink3, fontWeight: 500 }}>
          Loading members and conversations...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        title="Chat"
        marathi="à¤¸à¤‚à¤µà¤¾à¤¦"
        subtitle="Real-time messaging with people you're connected to"
        actions={<>
          <Btn kind="ghost" size="md" iconL="search">Search messages</Btn>
          <Btn kind="dark" size="md" iconL="plus" onClick={() => setNewChatOpen(true)}>New chat</Btn>
        </>}
      />

      <Card pad={0} className="mob-stack" style={{ overflow: 'hidden', display: 'grid', gridTemplateColumns: '320px 1fr', height: 640 }}>
        {/* Sidebar */}
        <aside style={{ borderRight: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.line}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: C.bgDeep, borderRadius: 10 }}>
              <Icon name="search" size={15} color={C.ink3}/>
              <input value={searchPeople} onChange={e => setSearchPeople(e.target.value)} placeholder="Search people, groupsâ€¦" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}/>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConvs.map((c, i) => {
              const isActive = c.id === activeConv?.id;
              return (
                <div key={i} onClick={() => setActiveId(c.id)} style={{
                  padding: '12px 16px', cursor: 'pointer',
                  background: isActive ? C.surfaceAlt : 'transparent',
                  borderLeft: `3px solid ${isActive ? C.saffron : 'transparent'}`,
                  borderBottom: `1px solid ${C.line}`,
                  display: 'flex', gap: 12, alignItems: 'center',
                }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar name={c.name} size={42} style={{ fontSize: 14 }}/>
                    {c.online && <span style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, background: C.green, border: '2px solid #fff', borderRadius: '50%' }}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.name}{c.isGroup && <span style={{ color: C.ink3, fontWeight: 500, fontSize: 11, marginLeft: 4 }}>Â· group</span>}
                      </span>
                      <span style={{ fontSize: 11, color: C.ink3, fontWeight: 500, flexShrink: 0 }}>
                        {c.lastMessageTime ? c.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: c.unread ? C.ink2 : C.ink3, fontWeight: c.unread ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.lastMessage}
                      </span>
                      {!!c.unread && (
                        <span style={{ background: C.saffron, color: '#fff', padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{c.unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Thread */}
        {activeConv ? (
          <section style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
            <header style={{ padding: '14px 22px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={activeConv.name} size={40}/>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>{activeConv.name}</div>
                  <div style={{ fontSize: 11.5, color: activeConv.online ? C.green : C.ink3, fontWeight: 600, marginTop: 1 }}>
                    â— {activeConv.online ? 'Online' : 'Last seen 1h ago'} {activeConv.mandal && <span style={{ color: C.ink4 }}> Â· {activeConv.mandal}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>{taxiRequestId && taxiQuoteId && !activeConv.isGroup && <Btn kind="primary" size="sm" onClick={() => setTaxiBookingOpen(true)}>Book Driver</Btn>}
                <button style={{ width: 36, height: 36, borderRadius: 8, background: C.bgDeep, border: `1px solid ${C.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="user" size={16} color={C.ink2}/>
                </button>
                <button style={{ width: 36, height: 36, borderRadius: 8, background: C.bgDeep, border: `1px solid ${C.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="settings" size={16} color={C.ink2}/>
                </button>
              </div>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px', background: C.surfaceAlt, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ textAlign: 'center', margin: '4px 0 12px', fontSize: 11, color: C.ink3, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Today
              </div>
              {messages.map((m, i) => {
                const isMe = m.senderId === currentUser?.uid;
                return (
                  <div key={m.id || i} style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                  }}>
                    {!isMe && activeConv.isGroup && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, marginBottom: 2, paddingLeft: 4 }}>
                        {m.senderName}
                      </div>
                    )}
                    <div style={{
                      background: isMe ? C.saffron : '#fff',
                      color: isMe ? '#fff' : C.ink,
                      padding: '10px 14px',
                      borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      fontSize: 13.5, fontWeight: 500, lineHeight: 1.45,
                      boxShadow: isMe ? '0 1px 3px rgba(184, 79, 18, 0.2)' : '0 1px 3px rgba(15, 14, 12, 0.06)',
                      border: isMe ? 'none' : `1px solid ${C.line}`,
                    }}>
                      {m.text}
                    </div>
                    <div style={{ fontSize: 10.5, color: C.ink3, fontWeight: 500, marginTop: 4, textAlign: isMe ? 'right' : 'left', padding: '0 6px' }}>
                      {m.at}{isMe && ' Â· Read'}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef}/>
            </div>

            <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.line}`, display: 'flex', gap: 10, alignItems: 'center' }}>
              <button style={{ width: 38, height: 38, borderRadius: 10, background: C.bgDeep, border: `1px solid ${C.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={16} color={C.ink2}/>
              </button>
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Message ${activeConv.name}â€¦`}
                style={{
                  flex: 1, padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 10,
                  fontSize: 13.5, fontWeight: 500, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <Btn kind={draft ? 'primary' : 'subtle'} size="md" icon="arrow" onClick={sendMessage}>Send</Btn>
            </div>
          </section>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: C.ink3, padding: 40 }}>
            <Icon name="chat" size={48} color={C.ink4} />
            <h3 style={{ margin: '12px 0 4px', color: C.ink }}>Select a conversation</h3>
            <p style={{ margin: 0, fontSize: 13.5 }}>Choose a contact from the sidebar or click "New chat" to start.</p>
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: C.ink3, fontWeight: 500 }}>
        <Tag color={C.green} bg={C.greenLt}>â— End-to-end encrypted</Tag>
        Messages are private between you and your community connections.
      </div>

      <Modal isOpen={taxiBookingOpen} onClose={() => !taxiBooking && setTaxiBookingOpen(false)} title="Booking Confirmed?" width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <p style={{ margin: 0, color: C.ink2, fontSize: 16 }}>Is your booking confirmed with {activeConv?.name || queryUser || 'this driver'}?</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}><Btn kind="ghost" size="md" disabled={taxiBooking} onClick={() => setTaxiBookingOpen(false)}>No</Btn><Btn kind="primary" size="md" disabled={taxiBooking} onClick={confirmTaxiBooking}>{taxiBooking ? 'Confirming...' : 'Yes'}</Btn></div>
        </div>
      </Modal>
      {/* Modal: New Chat (list of connected users) */}
      {newChatOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 14, 12, 0.4)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <Card style={{ width: '100%', maxWidth: 440, padding: 24, position: 'relative' }}>
            <button
              onClick={() => setNewChatOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 18, color: C.ink3, fontWeight: 700 }}>âœ•</span>
            </button>

            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: C.ink }}>Start a conversation</h3>

            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myFriends.length === 0 ? (
                <div style={{ textAlign: 'center', color: C.ink3, padding: 20, fontSize: 13.5 }}>
                  No connections found. Connect with members in the Community tab to start chatting!
                </div>
              ) : (
                myFriends.map(f => (
                  <div
                    key={f.uid}
                    onClick={() => handleStartChat(f.uid, f.name)}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'center', padding: 10, borderRadius: 8,
                      cursor: 'pointer', transition: 'background 0.12s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bgDeep}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Avatar name={f.name} size={36} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: C.ink3 }}>{f.description}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading chat interface...</div>}>
      <ChatContent />
    </Suspense>
  );
}
