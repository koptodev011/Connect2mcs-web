'use client';

import { useState } from 'react';
import { C, F } from '@/lib/tokens';
import { PageHeader, Card, Btn, Pill } from '@/components/primitives';
import Icon from '@/components/Icon';

const notificationsData = [
  { id: '1', title: 'Pune Mandal posted a new event', sub: 'Ganesh Utsav 2026 prep meeting', time: '2 hours ago', icon: 'cal', color: C.saffronDk, bg: C.saffronLt, read: false },
  { id: '2', title: 'New job match', sub: 'Senior Frontend Engineer at TechCorp Boston', time: '5 hours ago', icon: 'work', color: C.green, bg: '#E6F4EA', read: false },
  { id: '3', title: 'Message from Rahul D.', sub: '"Hey, are you attending the meetup tomorrow?"', time: 'Yesterday', icon: 'chat', color: C.blue, bg: '#E8F0FE', read: true },
  { id: '4', title: 'Housing requirement match', sub: 'Someone is looking for a roommate in Boston', time: 'Yesterday', icon: 'home', color: C.brick, bg: '#FAE0DA', read: true },
  { id: '5', title: 'Welcome to Connect2MCS', sub: 'Complete your profile to get discovered', time: '3 days ago', icon: 'user', color: C.ink2, bg: C.bgDeep, read: true },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(notificationsData);
  const [filter, setFilter] = useState('All');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (filter === 'Unread') return !n.read;
    return true;
  });

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const toggleRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Notifications"
        marathi="सूचना"
        subtitle={`You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`}
        actions={
          unreadCount > 0 ? (
            <Btn kind="ghost" size="md" onClick={markAllRead}>Mark all read</Btn>
          ) : undefined
        }
      />

      <div style={{ display: 'flex', gap: 6 }}>
        {['All', 'Unread'].map(f => (
          <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Pill>
        ))}
      </div>

      <Card pad={0} style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: C.ink3 }}>
            <Icon name="bell" size={32} color={C.line} />
            <div style={{ marginTop: 12, fontSize: 15, fontWeight: 600, color: C.ink }}>You're all caught up</div>
            <div style={{ marginTop: 4, fontSize: 13 }}>No notifications to show here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map(n => (
              <div
                key={n.id}
                onClick={() => toggleRead(n.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 16, alignItems: 'flex-start',
                  padding: '20px 24px', borderBottom: `1px solid ${C.line}`,
                  background: n.read ? '#fff' : 'rgba(226,106,31,0.03)',
                  cursor: 'pointer', transition: 'background 0.12s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.bgDeep)}
                onMouseLeave={e => (e.currentTarget.style.background = n.read ? '#fff' : 'rgba(226,106,31,0.03)')}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: n.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={n.icon as any} size={22} color={n.color}/>
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: n.read ? 600 : 700, color: C.ink, lineHeight: 1.4 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: C.ink2, marginTop: 4 }}>{n.sub}</div>
                  <div style={{ fontSize: 11.5, color: C.ink4, fontWeight: 500, marginTop: 8 }}>{n.time}</div>
                </div>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.saffron, marginTop: 6 }}/>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
