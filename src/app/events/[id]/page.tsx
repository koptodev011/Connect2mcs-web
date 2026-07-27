'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, ImgPh, Tag, useGlobalToast } from '@/components/primitives';
import { BookModal } from '@/components/FormModals';
import { CalendarEvent } from '@/data/events';
import type { SceneKind } from '@/components/Scenes';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [isRsvped, setIsRsvped] = useState(false);
  const toast = useGlobalToast();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: event?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.add('Link copied to clipboard!', 'success');
    }
  };

  useEffect(() => {
    fetch('/api/data/events')
      .then(res => res.json())
      .then((data: CalendarEvent[]) => {
        const found = data.find(e => e.id === id);
        if (found) setEvent(found);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div style={{ padding: 40, color: C.ink3, fontSize: 14 }}>Loading event details...</div>;
  }

  if (!event) return notFound();

  const kind: SceneKind =
    event.cat === 'Music' ? 'music' :
    event.cat === 'Literary' ? 'study' :
    event.cat === 'Family' ? 'food' :
    event.cat === 'Cultural' ? 'dance' :
    'event';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Link href="/events" style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.ink3, fontSize: 13, fontWeight: 600, textDecoration: 'none', width: 'fit-content' }}>
        <Icon name="chevL" size={14} color={C.ink3} /> Back to events
      </Link>
      
      <Card pad={0} style={{ overflow: 'hidden' }}>
        {event.image ? (
          <div style={{ height: 320, width: '100%' }}>
            <img src={event.image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <ImgPh kind={kind} height={320} tone={event.tone} />
        )}
        <div style={{ padding: '32px 36px' }}>
          <div className="mob-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <Tag color={C.saffronDk} bg={C.saffronLt}>{event.cat}</Tag>
              <h1 style={{ margin: '16px 0 12px', fontFamily: F.display, fontSize: 32, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{event.title}</h1>
              {event.fullDate && <div style={{ fontSize: 14, color: C.ink3, fontWeight: 500, marginBottom: 12 }}>{event.fullDate}</div>}
              <p style={{ margin: '0 0 24px', fontSize: 15, color: C.ink2, fontWeight: 500, lineHeight: 1.6, maxWidth: 640 }}>
                {event.desc || `Join us for the ${event.title}. Experience the vibrant culture, connect with community members, and celebrate together.`}
              </p>
            </div>
            <div style={{ background: C.bgDeep, padding: '16px 20px', borderRadius: 14, minWidth: 160, flexShrink: 0, textAlign: 'center', border: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 11, color: C.saffronDk, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{event.month}</div>
              <div className="num" style={{ fontFamily: F.display, fontSize: 42, fontWeight: 700, color: C.ink, lineHeight: 1, marginTop: 4 }}>{event.day}</div>
              <div style={{ fontSize: 12, color: C.ink3, fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{event.wk}</div>
            </div>
          </div>
          
          <div className="mob-stack" style={{ display: 'flex', gap: 24, padding: '24px 0', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={14}/> Location</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 8 }}>{event.where}{event.country && `, ${event.country}`}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="money" size={14}/> Price</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 8 }}>{event.free ? 'Free Entry' : event.price}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="people" size={14}/> Attendees</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 8 }}>{event.going} attending</div>
            </div>
            {event.organizer && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="star" size={14}/> Organizer</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 8 }}>{event.organizer}</div>
              </div>
            )}
            {event.value && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="spark" size={14}/> Highlights</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 8 }}>{event.value}</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            {event.link ? (
              <a href={event.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <Btn kind={isRsvped ? 'soft' : 'primary'} size="lg" iconL={isRsvped ? 'check' : 'cal'} onClick={() => setIsRsvped(true)}>
                  {isRsvped ? 'Tickets acquired' : 'RSVP / Get Tickets ↗'}
                </Btn>
              </a>
            ) : (
              <Btn kind={isRsvped ? 'soft' : 'primary'} size="lg" iconL={isRsvped ? 'check' : 'cal'} onClick={() => isRsvped ? setIsRsvped(false) : setRsvpOpen(true)}>
                {isRsvped ? 'RSVP Confirmed' : 'RSVP / Get Tickets'}
              </Btn>
            )}
            <Btn kind="outline" size="lg" onClick={handleShare}><Icon name="share" size={18} color={C.ink}/></Btn>
          </div>
        </div>
      </Card>
      
      <BookModal 
        isOpen={rsvpOpen} onClose={() => setRsvpOpen(false)}
        title={`RSVP for ${event.title}`} marathi="नोंदणी"
        submitLabel="Confirm RSVP"
        fields={[
          { key: 'tickets', label: 'Number of tickets', placeholder: '1' },
          { key: 'note', label: 'Special requirements', placeholder: 'Dietary, seating...', multiline: true },
        ]}
      />
    </div>
  );
}
