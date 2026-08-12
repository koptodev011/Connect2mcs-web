'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { C } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, ImgPh, Tag, useGlobalToast } from '@/components/primitives';
import { BookModal } from '@/components/FormModals';
import { CalendarEvent } from '@/data/events';
import type { SceneKind } from '@/components/Scenes';
import styles from './page.module.css';

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
    return <div className={styles.loading}>Loading event details...</div>;
  }

  if (!event) return notFound();

  const kind: SceneKind =
    event.cat === 'Music' ? 'music' :
    event.cat === 'Literary' ? 'study' :
    event.cat === 'Family' ? 'food' :
    event.cat === 'Cultural' ? 'dance' :
    'event';

  return (
    <div className={styles.page}>
      <Link href="/events" className={styles.backLink}>
        <Icon name="chevL" size={14} color={C.ink3} /> Back to events
      </Link>

      <Card pad={0} className={styles.card}>
        {event.image ? (
          <div className={styles.hero}>
            <img src={event.image} alt={event.title} className={styles.heroImage} />
          </div>
        ) : (
          <ImgPh kind={kind} height={320} tone={event.tone} />
        )}
        <div className={styles.content}>
          <div className={`mob-stack ${styles.headingRow}`}>
            <div>
              <Tag color={C.saffronDk} bg={C.saffronLt}>{event.cat}</Tag>
              <h1 className={styles.title}>{event.title}</h1>
              {event.fullDate && <div className={styles.fullDate}>{event.fullDate}</div>}
              <p className={styles.description}>
                {event.desc || `Join us for the ${event.title}. Experience the vibrant culture, connect with community members, and celebrate together.`}
              </p>
            </div>
            <div className={styles.dateCard}>
              <div className={styles.month}>{event.month}</div>
              <div className={`num ${styles.day}`}>{event.day}</div>
              <div className={styles.weekday}>{event.wk}</div>
            </div>
          </div>

          <div className={`mob-stack ${styles.metaRow}`}>
            <div>
              <div className={styles.metaLabel}><Icon name="pin" size={14}/> Location</div>
              <div className={styles.metaValue}>{event.where}{event.country && `, ${event.country}`}</div>
            </div>
            <div>
              <div className={styles.metaLabel}><Icon name="money" size={14}/> Price</div>
              <div className={styles.metaValue}>{event.free ? 'Free Entry' : event.price}</div>
            </div>
            <div>
              <div className={styles.metaLabel}><Icon name="people" size={14}/> Attendees</div>
              <div className={styles.metaValue}>{event.going} attending</div>
            </div>
            {event.organizer && (
              <div>
                <div className={styles.metaLabel}><Icon name="star" size={14}/> Organizer</div>
                <div className={styles.metaValue}>{event.organizer}</div>
              </div>
            )}
            {event.value && (
              <div>
                <div className={styles.metaLabel}><Icon name="spark" size={14}/> Highlights</div>
                <div className={styles.metaValue}>{event.value}</div>
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
