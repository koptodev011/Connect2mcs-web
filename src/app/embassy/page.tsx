'use client';

import Link from 'next/link';
import { C, F } from '@/lib/tokens';
import { Card, SectionHead, Btn, Avatar, useGlobalToast } from '@/components/primitives';
import Icon from '@/components/Icon';
import { emergencyContacts, missions, advisories } from '@/data/embassy';

export default function EmbassyPage() {
  const toast = useGlobalToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1A3673 0%, #11234D 100%)',
        borderRadius: 22,
        padding: '36px 40px',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        boxShadow: '0 8px 24px rgba(26, 54, 115, 0.2)',
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24 }}>🏛️</span>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.saffron, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                भारत सरकार • GOVERNMENT OF INDIA
              </div>
              <h1 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, margin: '2px 0 0', letterSpacing: '-0.02em' }}>
                Embassy & Consular Services
              </h1>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                Ministry of External Affairs - for Indian nationals abroad
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '16px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="pin" size={20} color={C.saffron} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Your Mission: Embassy of India, Abu Dhabi</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Based on your location - United Arab Emirates</div>
              </div>
            </div>
            <div style={{ background: C.green, color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Open Now</div>
          </div>
        </div>
        
        {/* Ashoka Chakra watermark */}
        <div style={{ position: 'absolute', right: -40, top: -40, opacity: 0.1, fontSize: 240, userSelect: 'none' }}>
          ☸
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
        
        {/* Left Column: Missions & Advisories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          <section>
            <SectionHead title="Indian Missions Near You" subtitle="Embassies & consulates by distance" action="Map >" onAction={() => window.open('https://maps.google.com/?q=Indian+Embassies', '_blank')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {missions.map(mission => (
                <Card key={mission.id} pad={20} style={{ border: `1px solid ${C.line}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#1A3673', background: '#E8ECF4', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>{mission.type}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: mission.status === 'Open' ? C.green : C.brick, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: mission.status === 'Open' ? C.green : C.brick }} />
                          {mission.status}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: C.ink, fontFamily: F.display, margin: '0 0 4px' }}>{mission.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: C.ink3 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pin" size={14} color={C.ink3} /> {mission.location}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={14} color={C.ink3} /> {mission.hours}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1A3673' }}>{mission.distance}</div>
                      <div style={{ fontSize: 11, color: C.ink3, fontWeight: 500 }}>away</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
                    <Btn kind="outline" size="sm" iconL="phone" style={{ flex: 1, color: C.green, borderColor: C.green }} onClick={() => window.open('tel:+1234567890', '_self')}>Call</Btn>
                    <Btn kind="outline" size="sm" iconL="map" style={{ flex: 1, color: '#1A3673', borderColor: '#1A3673' }} onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(mission.location + ' Indian Embassy')}`, '_blank')}>Directions</Btn>
                    <Link href={`/embassy/${mission.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                      <Btn kind="soft" size="sm" full style={{ color: C.brick }}>Details &gt;</Btn>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <SectionHead title="News & Advisories" subtitle="Official notices from the mission" action="All >" onAction={() => window.open('https://www.mea.gov.in/', '_blank')} />
            <Card pad={0}>
              {advisories.map((adv, idx) => (
                <div key={adv.id} style={{ padding: '16px 20px', borderBottom: idx < advisories.length - 1 ? `1px solid ${C.line}` : 'none', display: 'flex', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: adv.type === 'ADVISORY' ? '#FEE2E2' : adv.type === 'NOTICE' ? '#DCFCE7' : '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: adv.type === 'ADVISORY' ? C.brick : adv.type === 'NOTICE' ? C.green : C.saffronDk }}>
                      {adv.type === 'ADVISORY' ? '⚠️' : adv.type === 'NOTICE' ? '📄' : '🌐'}
                    </span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: adv.type === 'ADVISORY' ? C.brick : adv.type === 'NOTICE' ? C.green : C.saffronDk, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{adv.type}</span>
                      {adv.pinned && <span style={{ fontSize: 10, color: C.ink3, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pin" size={10} color={C.brick}/> Pinned</span>}
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, lineHeight: 1.4, marginBottom: 4 }}>{adv.title}</div>
                    <div style={{ fontSize: 12, color: C.ink3 }}>{adv.time}</div>
                  </div>
                </div>
              ))}
            </Card>
          </section>

        </div>

        {/* Right Column: Emergency Contacts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionHead title="Emergency Contacts" subtitle="Toll-free & 24x7 assistance" />
          
          <Card pad={20} style={{ background: '#FFF1F0', borderColor: '#FCA5A5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.brick, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Icon name="phone" size={24} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.brick, marginBottom: 2 }}>24x7 Emergency Helpline</div>
                <div style={{ fontSize: 12, color: '#991B1B', fontWeight: 500 }}>For Indians in distress abroad</div>
              </div>
              <Btn kind="primary" style={{ background: C.brick, color: '#fff' }} onClick={() => window.open('tel:+1800112233', '_self')}>Call</Btn>
            </div>
          </Card>

          {emergencyContacts.map(contact => (
            <Card key={contact.id} pad={16} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${contact.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={contact.isLink ? 'globe' : 'phone'} size={18} color={contact.color} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{contact.title}</div>
                  <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{contact.subtitle}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: contact.color, marginTop: 4 }}>{contact.phone}</div>
                </div>
              </div>
              <button 
                onClick={() => window.open(contact.isLink ? contact.phone : `tel:${contact.phone}`, contact.isLink ? '_blank' : '_self')}
                style={{ width: 40, height: 40, borderRadius: '50%', background: contact.color, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name={contact.isLink ? 'link' : 'phone'} size={18} color="#fff" />
              </button>
            </Card>
          ))}
          
          <div style={{ textAlign: 'center', fontSize: 11, color: C.ink4, marginTop: 16, padding: '0 20px' }}>
            Information sourced from official Government of India missions. Connect2MCS is a community directory, not a government body.
          </div>
        </div>

      </div>
    </div>
  );
}
