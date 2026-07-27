'use client';

import { useState } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, Avatar, SectionHead, PageHeader, Stat, Modal, Field } from '@/components/primitives';
import { mentors, mentorSessions, mentorStats } from '@/data/mentorship';
import { BecomeMentorModal } from '@/components/FormModals';

const fields = ['All', 'Tech', 'Design', 'Business', 'Medicine', 'Arts & Media', 'Academia', 'Entrepreneurship'];

const statusStyles = {
  upcoming: { bg: C.saffronLt, fg: C.saffronDk, dot: C.saffron, label: 'Upcoming' },
  past:     { bg: C.bgDeep,    fg: C.ink3,      dot: C.ink4,    label: 'Completed' },
} as const;

export default function MentorshipPage() {
  const [active, setActive] = useState('All');
  const [becomeMentorOpen, setBecomeMentorOpen] = useState(false);
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState(mentorSessions);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookTarget, setBookTarget] = useState({ name: '', topic: '' });
  const [bookDate, setBookDate] = useState('');
  const [sortBy, setSortBy] = useState('Best match');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Mentorship"
        marathi="मार्गदर्शन"
        subtitle="142 mentors offering time · book a 30-min session free with most"
        actions={<>
          <Btn kind="ghost" size="md" iconL="cal">My sessions</Btn>
          <Btn kind="dark" size="md" iconL="plus" onClick={() => setBecomeMentorOpen(true)}>Become a mentor</Btn>
        </>}
      />

      <div className="mob-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {mentorStats.map((s, i) => (
          <Card key={i} pad={20}><Stat value={s.v} label={s.l} hint={s.h}/></Card>
        ))}
      </div>

      {/* Your sessions */}
      <Card pad={0}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>Your sessions</div>
            <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 2 }}>{sessions.filter(s => s.status === 'upcoming').length} upcoming · {sessions.filter(s => s.status === 'past').length} completed this month</div>
          </div>
          <Btn kind="ghost" size="sm">View all</Btn>
        </div>
        {sessions.map((s, i) => {
          const st = statusStyles[s.status];
          return (
            <div key={i} className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 16, alignItems: 'center', padding: '14px 18px', borderBottom: i < sessions.length - 1 ? `1px solid ${C.line}` : 'none' }}>
              <Avatar name={s.with} size={40} style={{ fontSize: 14 }}/>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{s.topic}</div>
                <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 2 }}>with {s.with} · {s.when}</div>
              </div>
              <span style={{ background: st.bg, color: st.fg, padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>● {st.label}</span>
              <Btn kind={s.status === 'upcoming' ? 'primary' : 'outline'} size="sm">
                {s.status === 'upcoming' ? 'Join call' : 'View notes'}
              </Btn>
            </div>
          );
        })}
      </Card>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
        {fields.map(f => <Pill key={f} active={active === f} onClick={() => setActive(f)}>{f}</Pill>)}
      </div>

      {/* Mentor grid */}
      <section>
        <SectionHead 
          title="Find a mentor" 
          subtitle={`Showing ${mentors.filter(m => active === 'All' || m.topics.some(t => t.toLowerCase().includes(active.toLowerCase()) || active.toLowerCase().includes(t.toLowerCase()) || (active === 'Tech' && t.includes('Engineer')) || (active === 'Design' && t.includes('Design')) || (active === 'Business' && t.includes('Product')) )).length} of ${mentors.length}`} 
          action={
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ appearance: 'none', background: 'transparent', border: 'none', color: C.ink3, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
              <option value="Best match">Sort: Best match</option>
              <option value="Experience">Sort: Experience</option>
            </select>
          }
        />
        <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {mentors.filter(m => active === 'All' || m.topics.some(t => t.toLowerCase().includes(active.toLowerCase()) || active.toLowerCase().includes(t.toLowerCase()) || (active === 'Tech' && t.includes('Engineer')) || (active === 'Design' && t.includes('Design')) || (active === 'Business' && t.includes('Product')) )).map((m, i) => (
            <Card key={i} interactive>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <Avatar name={m.name} size={52} style={{ fontSize: 18 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.25 }}>{m.name}</div>
                  <div style={{ fontSize: 12.5, color: C.ink3, fontWeight: 500, marginTop: 2, lineHeight: 1.35 }}>{m.role}</div>
                  <div style={{ fontSize: 11, color: C.ink4, fontWeight: 600, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {m.city} · {m.mandal}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {m.topics.map(t => <Tag key={t} color={C.ink2} bg={C.bgDeep}>{t}</Tag>)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, padding: '10px 0', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, fontSize: 11.5, fontWeight: 600 }}>
                <div>
                  <div style={{ color: C.ink4 }}>YEARS</div>
                  <div className="num" style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: C.ink }}>{m.years}+</div>
                </div>
                <div>
                  <div style={{ color: C.ink4 }}>SLOTS</div>
                  <div className="num" style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: m.slots > 0 ? C.green : C.ink3 }}>{m.slots}</div>
                </div>
                <div>
                  <div style={{ color: C.ink4 }}>RATE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: m.rate === 'Free' ? C.green : C.ink }}>{m.rate}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Btn kind={booked.has(m.name) ? 'soft' : 'primary'} size="sm" full onClick={() => {
                  if (booked.has(m.name)) return;
                  setBookTarget({ name: m.name, topic: m.topics[0] || 'Mentorship' });
                  setBookDate('');
                  setBookModalOpen(true);
                }}>{booked.has(m.name) ? 'Booked ✓' : 'Book session'}</Btn>
                <Btn kind="outline" size="sm" onClick={() => { window.location.href = `mailto:mentor@connect2mcs.com?subject=Contacting ${m.name}`; }}><Icon name="chat" size={14}/></Btn>
              </div>
            </Card>
          ))}
        </div>
      </section>
      <BecomeMentorModal isOpen={becomeMentorOpen} onClose={() => setBecomeMentorOpen(false)}/>
      
      <Modal isOpen={bookModalOpen} onClose={() => setBookModalOpen(false)} title="Book a Session" width={400}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.ink3, fontWeight: 500, marginBottom: 16 }}>
            Booking a 30-min session with <strong>{bookTarget.name}</strong>
          </div>
          <Field 
            label="Preferred date/time" 
            value={bookDate} 
            onChange={setBookDate} 
            placeholder="e.g. Tomorrow at 10 AM" 
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="primary" size="md" full onClick={() => {
            if (bookDate) {
              setSessions(s => [{ with: bookTarget.name, topic: bookTarget.topic, when: bookDate, status: 'upcoming' }, ...s]);
              setBooked(b => new Set(b).add(bookTarget.name));
              setBookModalOpen(false);
            }
          }}>Confirm booking</Btn>
          <Btn kind="ghost" size="md" onClick={() => setBookModalOpen(false)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  );
}
