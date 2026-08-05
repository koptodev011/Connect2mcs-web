'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, ImgPh, Rating, Avatar, useGlobalToast } from '@/components/primitives';
import { Mandal } from '@/data/mandals';
import { CalendarEvent } from '@/data/events';
import { ContactModal, BookModal } from '@/components/FormModals';
import { OrnamentDivider } from '@/components/Ornament';
import { toneColor, toneBg } from '@/lib/tones';

interface CommitteeMember {
  name: string;
  role: string;
  email: string;
  avatar: string;
  phone?: string;
}

interface SocialMedia {
  id: string;
  name: string;
  url: string;
  type: string;
  mandalId: string;
}

export default function MandalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mandal, setMandal] = useState<Mandal | null>(null);
  const [socials, setSocials] = useState<SocialMedia[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [committee, setCommittee] = useState<CommitteeMember[]>([]);
  const [gallery, setGallery] = useState<{ img: string; title: string; desc: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinInitialValues, setJoinInitialValues] = useState<Record<string, string>>({});
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());
  const toast = useGlobalToast();
  const router = useRouter();

  const handleJoinMandal = async () => {
    if (joined) {
      setJoined(false);
      return;
    }

    try {
      const savedUser = localStorage.getItem('mcs_user');
      const user = savedUser ? JSON.parse(savedUser) : null;
      if (!user || user.isGuest) {
        router.push('/login');
        return;
      }

      let profile = user;
      if (user.name) {
        const response = await fetch(`/api/data/profile?username=${encodeURIComponent(user.name)}`);
        const profiles = response.ok ? await response.json() : [];
        if (Array.isArray(profiles) && profiles[0]) profile = { ...user, ...profiles[0] };
      }

      setJoinInitialValues({
        name: String(profile.name || profile.Name || user.name || ''),
        email: String(profile.email || profile.EMail || user.email || ''),
        phone: String(profile.phone || profile.Phone || profile.Phone2 || user.phone || ''),
        note: '',
      });
      setJoinOpen(true);
    } catch {
      router.push('/login');
    }
  };

  const submitJoinRequest = async (form: Record<string, string>) => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      throw new Error('Name, email, and contact number are required');
    }
    if (!mandal?.id) throw new Error('Mandal details are unavailable');

    const response = await fetch('/api/mandal-membership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mandalId: mandal.id, ...form }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Could not send membership request');
    setJoined(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: mandal?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.add('Link copied to clipboard!', 'success');
    }
  };

  const toggleRsvp = (eventId: string) => {
    setRsvps(s => {
      const n = new Set(s);
      if (n.has(eventId)) {
        n.delete(eventId);
        toast.add('RSVP cancelled', 'info');
      } else {
        n.add(eventId);
        toast.add('RSVP confirmed! Add to calendar.', 'success');
      }
      return n;
    });
  };

  useEffect(() => {
    fetch('/api/data/mandals')
      .then(res => res.json())
      .then(async (mandalsData: Mandal[]) => {
        const found = mandalsData.find(m => m.code === id) as (Mandal & { id?: string }) | undefined;
        if (found && found.id) {
          const detailRes = await fetch(`/api/data/mandals?id=${found.id}`);
          const parsedDetails = await detailRes.json();
          
          setMandal(parsedDetails.mandal || found);
          setSocials(parsedDetails.socials || []);
          
          if (Array.isArray(parsedDetails.committee) && parsedDetails.committee.length > 0) {
            setCommittee(parsedDetails.committee);
          } 
          // else {
          //   setCommittee([
          //     { name: 'Dr. Ramesh Deshpande', role: 'President', email: `president@${found.code.toLowerCase()}.org`, avatar: 'RD' },
          //     { name: 'Sunita Kulkarni', role: 'Secretary', email: `secretary@${found.code.toLowerCase()}.org`, avatar: 'SK' },
          //     { name: 'Rahul Joshi', role: 'Treasurer', email: `treasurer@${found.code.toLowerCase()}.org`, avatar: 'RJ' },
          //     { name: 'Priya Joshi-Patil', role: 'Cultural Coordinator', email: `cultural@${found.code.toLowerCase()}.org`, avatar: 'PJP' },
          //   ]);
          // }

          if (Array.isArray(parsedDetails.gallery)) {
            setGallery(parsedDetails.gallery);
          }

          if (Array.isArray(parsedDetails.events) && parsedDetails.events.length > 0) {
            setEvents(parsedDetails.events);
          } else {
            const eventsRes = await fetch('/api/data/events').then(res => res.json()).catch(() => []);
            if (Array.isArray(eventsRes)) {
              const filtered = eventsRes.filter((e: CalendarEvent) => {
                const cityMatch = e.where && found.city && e.where.toLowerCase().includes(found.city.toLowerCase().split(',')[0].trim());
                const orgMatch = e.organizer && (
                  e.organizer.toLowerCase().includes(found.code.toLowerCase()) ||
                  e.organizer.toLowerCase().includes(found.name.toLowerCase())
                );
                const titleMatch = e.title && (
                  e.title.toLowerCase().includes(found.code.toLowerCase()) ||
                  e.title.toLowerCase().includes(found.name.toLowerCase())
                );
                return cityMatch || orgMatch || titleMatch;
              });
              setEvents(filtered.length > 0 ? filtered : eventsRes.slice(0, 2));
            }
          }
        } else {
          setMandal(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div style={{ padding: 40, color: C.ink3, fontSize: 14 }}>Loading mandal details...</div>;
  }

  if (!mandal) return notFound();

  const primaryColor = toneColor[mandal.tone] || C.saffronDk;
  const lightBgColor = toneBg[mandal.tone] || C.saffronLt;

  // Custom inline styles for transitions
  const cardStyle: React.CSSProperties = {
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Back button */}
      <Link href="/mandals" style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.ink3, fontSize: 13, fontWeight: 600, textDecoration: 'none', width: 'fit-content' }}>
        <Icon name="chevL" size={14} color={C.ink3} /> Back to Mandals
      </Link>
      
      {/* 1. Header Card (Hero) */}
      <Card pad={0} style={{ overflow: 'hidden', borderBottom: `4px solid ${primaryColor}` }}>
        <ImgPh kind="mandal" height={260} tone={mandal.tone} badge={mandal.hosting ? 'Hosting an event soon' : undefined} src={mandal.image} />
        <div style={{ padding: '32px 36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 12px', fontFamily: F.display, fontSize: 36, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {mandal.name}
              </h1>
              <div style={{ fontSize: 15, color: C.ink2, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Icon name="pin" size={16} color={C.ink3} /> 
                <span>{mandal.city}, {mandal.region || mandal.country}</span>
                <span style={{ color: C.lineMid }}>•</span>
                <span>Established in {mandal.est}</span>
              </div>
            </div>
            {mandal.rating > 0 && <Rating value={mandal.rating} size="lg" />}
          </div>
          
          <div className="mob-stack" style={{ display: 'flex', gap: 32, padding: '24px 0', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, marginTop: 24 }}>
            <div>
              <div className="num" style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: C.ink }}>{mandal.members.toLocaleString()}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Active Members</div>
            </div>
            <div>
              <div className="num" style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: C.ink }}>{mandal.events}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Events this year</div>
            </div>
            {/* <div>
              <div className="num" style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: primaryColor }}>{mandal.dist || 'Local'}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Distance from you</div>
            </div> */}
          </div>
        </div>
      </Card>

      {/* 2. About Section */}
      <section id="about">
        <OrnamentDivider label="About" marathi="माहिती" align="left" />
        <Card style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 36, flexWrap: 'wrap' }} className="mob-stack">
            {/* Left Col: Info */}
            <div>
              <h3 style={{ margin: '0 0 14px', fontFamily: F.display, fontSize: 20, fontWeight: 600, color: C.ink }}>
                Our Mission & History
              </h3>
              <p style={{ margin: 0, fontSize: 15, color: C.ink2, fontWeight: 500, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                {mandal.about || `Welcome to ${mandal.name}. We are dedicated to preserving and promoting Marathi culture, language, and traditions in ${mandal.city}. Join our vibrant community to celebrate festivals, network with professionals, and participate in cultural events.`}
              </p>
              
              {mandal.address && (
                <div style={{ marginTop: 24, fontSize: 14, color: C.ink2, background: C.bgDeep + '40', padding: '16px 20px', borderRadius: 12, border: `1px solid ${C.line}` }}>
                  <div style={{ fontWeight: 700, color: C.ink, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="map" size={16} color={primaryColor} /> Address / पत्ता
                  </div>
                  <div>{mandal.address}</div>
                  {mandal.postal && <div style={{ fontSize: 13, color: C.ink3, marginTop: 2 }}>Postal Code: {mandal.postal}</div>}
                </div>
              )}
            </div>

            {/* Right Col: CTA and Socials */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, borderLeft: `1px solid ${C.line}`, paddingLeft: 36 }} className="mob-pad-sm">
              <div>
                <h3 style={{ margin: '0 0 14px', fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink }}>
                  Interact with Us
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Btn kind={joined ? 'soft' : 'primary'} size="lg" full iconL={joined ? 'check' : 'plus'} onClick={handleJoinMandal} style={{ background: joined ? lightBgColor : primaryColor, borderColor: joined ? lightBgColor : primaryColor, color: joined ? primaryColor : '#fff' }}>
                    {joined ? 'Membership pending' : 'Join Mandal'}
                  </Btn>
                  {/* <Btn kind="outline" size="lg" full onClick={() => setContactOpen(true)}>Contact Committee</Btn> */}
                 {mandal.phone && <Btn kind="outline" size="lg" full onClick={() => window.open(`tel:${mandal.phone}`, '_self')} style={{ color: primaryColor, borderColor: primaryColor }}>
                  <Icon name="phone" size={18} color={primaryColor} />
                  Call {mandal.phone}
                 </Btn>}
                 {mandal.whatsapp && <Btn kind="outline" size="lg" full onClick={() => window.open(`https://wa.me/${mandal.whatsapp}`, '_blank')} style={{ color: primaryColor, borderColor: primaryColor }}>
                  <Icon name="whatsapp" size={18} color={primaryColor} />
                  WhatsApp {mandal.whatsapp}
                 </Btn>}
                  <Btn kind="ghost" size="lg" full onClick={handleShare}><Icon name="share" size={18} color={C.ink} /> Share Mandal</Btn>
                  {mandal.email && (
                    <a href={`mailto:${mandal.email}`} style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 22px', borderRadius: 10,
                      border: `1.5px dashed ${primaryColor}`, background: lightBgColor + '30', color: primaryColor,
                      fontSize: 14.5, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s', width: '100%',
                      fontFamily: F.ui
                    }} className="btn-int">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1 }}>
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      {mandal.email}
                    </a>
                  )}
                </div>
              </div>

              {socials.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Official Channels
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {socials.map(s => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, border: `1px solid ${C.line}`, background: '#fff', color: C.ink, fontSize: 12.5, fontWeight: 600, textDecoration: 'none', transition: 'border-color 0.2s' }}>
                        <Icon name="link" size={13} color={primaryColor} />
                        {s.type}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Committee Section */}
      {committee.length > 0 && (
      <section id="committee">
        <OrnamentDivider label="Committee" marathi="कार्यकारिणी" align="left" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, marginTop: 12 }}>
          {committee.map((member, idx) => (
            <Card key={idx} style={{ ...cardStyle, textAlign: 'center', borderTop: `3px solid ${primaryColor}` }} pad={20}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <Avatar name={member.name} size={64} />
              </div>
              <h4 style={{ margin: '0 0 4px', fontFamily: F.display, fontSize: 16, fontWeight: 700, color: C.ink }}>
                {member.name}
              </h4>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 14 }}>
                {member.role}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 14 }}>
                {/* 1. Call Button */}
                <a href={`tel:${member.phone || '15550192834'}`} title="Call" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%',
                  background: C.bgDeep + '60', border: `1px solid ${C.line}`, color: C.ink2, transition: 'all 0.2s'
                }} className="btn-int" onClick={(ev) => {
                  if (!member.phone) {
                    ev.preventDefault();
                    toast.add(`Calling: +1 (555) 019-2834`, 'info');
                  }
                }}>
                  <Icon name="phone" size={16} color={C.ink2} />
                </a>

                {/* 2. More Option Button */}
                <button title="More options" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%',
                  background: C.bgDeep + '60', border: `1px solid ${C.line}`, color: C.ink2, transition: 'all 0.2s', cursor: 'pointer'
                }} className="btn-int" onClick={() => {
                  navigator.clipboard.writeText(`${member.name}\n${member.role}\nEmail: ${member.email}`);
                  toast.add('Contact info copied to clipboard!', 'success');
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="19" cy="12" r="1.5"></circle>
                    <circle cx="5" cy="12" r="1.5"></circle>
                  </svg>
                </button>

                {/* 3. Mail Button */}
                <a href={`mailto:${member.email}`} title="Email" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%',
                  background: C.bgDeep + '60', border: `1px solid ${C.line}`, color: C.ink2, transition: 'all 0.2s'
                }} className="btn-int">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </a>
              </div>
            </Card>
          ))}
        </div>
      </section>
      )}

      {/* 4. Gallery Section */}
      {gallery.length > 0 && (
        <section id="gallery">
          <OrnamentDivider label="Gallery" marathi="चित्रदालन" align="left" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 12 }} className="mob-stack">
            {gallery.map((item, idx) => (
              <div key={idx} style={{
                position: 'relative', height: 220, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.line}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer'
              }} className="gallery-item-hover">
                <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(15,14,12,0.88) 0%, rgba(15,14,12,0.4) 60%, transparent 100%)',
                  padding: '16px 20px', color: '#fff'
                }}>
                  <h5 style={{ margin: 0, fontFamily: F.display, fontSize: 15, fontWeight: 700, color: '#fff' }}>{item.title}</h5>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Events Section */}
      <section id="events">
        <OrnamentDivider label="Events" marathi="आगामी कार्यक्रम" align="left" />
        {events.length === 0 ? (
          <Card style={{ textAlign: 'center', marginTop: 12, padding: 36 }}>
            <Icon name="cal" size={32} color={C.ink4} />
            <div style={{ marginTop: 10, fontSize: 14, color: C.ink3, fontWeight: 600 }}>No upcoming events scheduled at this moment.</div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 12 }} className="mob-stack">
            {events.map((e, idx) => {
              const isGoing = rsvps.has(e.id || idx.toString());
              return (
                <Card key={e.id || idx} pad={0} style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative' }}>
                    {e.image ? (
                      <img src={e.image} alt={e.title} style={{ height: 160, width: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImgPh kind="event" height={160} tone={e.tone} />
                    )}
                    <div style={{ position: 'absolute', top: 12, left: 12, background: '#fff', borderRadius: 10, padding: '6px 10px', textAlign: 'center', minWidth: 52, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                      <div style={{ fontSize: 10, color: primaryColor, fontWeight: 700, letterSpacing: '0.08em' }}>{e.month}</div>
                      <div className="num" style={{ fontSize: 22, fontWeight: 700, color: C.ink, lineHeight: 1, marginTop: 1, fontFamily: F.display }}>{e.day}</div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: primaryColor, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                      {e.cat}
                    </div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                      {e.title}
                    </h4>
                    {e.fullDate && <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 4, fontWeight: 500 }}>{e.fullDate}</div>}
                    {e.desc && <div style={{ fontSize: 13, color: C.ink2, marginTop: 8, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.desc}</div>}
                    
                    <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 12.5, color: C.ink3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="pin" size={13} color={C.ink3} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.where}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: C.ink3, fontWeight: 600 }}>{e.going ? `+${e.going} going` : 'Upcoming'}</span>
                        </div>
                        {e.link ? (
                          <Btn kind="soft" size="sm" onClick={() => window.open(e.link, '_blank')}>Register ↗</Btn>
                        ) : (
                          <Btn kind={isGoing ? 'primary' : 'soft'} size="sm" onClick={() => toggleRsvp(e.id || idx.toString())} style={{ background: isGoing ? primaryColor : undefined, color: isGoing ? '#fff' : undefined }}>
                            {isGoing ? 'Going ✓' : 'RSVP'}
                          </Btn>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Modals */}
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} title={`Contact ${mandal.name}`} subtitle="Direct message to the committee" />
      {joinOpen && <BookModal 
        isOpen={joinOpen} onClose={() => setJoinOpen(false)}
        title={`Join ${mandal.name}`} marathi="सामील व्हा"
        submitLabel="Submit membership request"
        initialValues={joinInitialValues}
        onSubmit={submitJoinRequest}
        fields={[
          { key: 'name', label: 'Name', placeholder: 'Your name' },
          { key: 'email', label: 'Email', placeholder: 'you@example.com', type: 'email' },
          { key: 'phone', label: 'Contact number', placeholder: 'Your contact number', type: 'tel' },
          { key: 'note', label: 'Why do you want to join?', placeholder: 'Optional note...', multiline: true },
        ]}
      />}
    </div>
  );
}

