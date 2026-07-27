'use client';

import { use, useState, useEffect } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Tag, Avatar, ImgPh, PageHeader, useGlobalToast } from '@/components/primitives';
import { communityPeople } from '@/data/community';
import type { CurrentUser } from '@/data/profile';
import Link from 'next/link';

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [member, setMember] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);
  const toast = useGlobalToast();

  useEffect(() => {
    // Decode ID and lookup in communityPeople
    const decodedName = decodeURIComponent(id).replace(/-/g, ' ');
    const found = communityPeople.find(p => p.name.toLowerCase() === decodedName.toLowerCase());
    
    if (found) {
      setMember({
        name: found.name,
        marathi: 'सदस्य',
        role: found.role,
        city: found.city,
        origin: 'Maharashtra',
        type: 'Verified',
        mandal: found.mandal,
        joined: '2025',
        bio: `Hi, I'm ${found.name}. I work as a ${found.role.split(' · ')[0]} and I'm currently based in ${found.city}. I'm active in the ${found.mandal} community.`,
        langs: ['Marathi', 'English'],
        open: [found.open],
        email: '',
        phone: ''
      });
    } else {
      // Fallback
      setMember({
        name: decodedName,
        marathi: 'सदस्य',
        role: 'Community Member',
        city: 'Global',
        origin: 'Maharashtra',
        type: 'Standard',
        mandal: 'Connect2MCS',
        joined: '2026',
        bio: `Hi, I'm ${decodedName}. I'm a member of Connect2MCS.`,
        langs: ['Marathi'],
        open: ['Networking'],
        email: '',
        phone: ''
      });
    }
    setLoading(false);
  }, [id]);

  if (loading || !member) return <div style={{ padding: 40, color: C.ink3 }}>Loading profile...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Link href="/community" style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.ink3, fontSize: 13, fontWeight: 600, textDecoration: 'none', width: 'fit-content' }}>
        <Icon name="chevL" size={14} color={C.ink3} /> Back to Community
      </Link>
      <PageHeader
        title={`${member.name}'s Profile`}
        marathi={member.marathi}
        subtitle="Connect and collaborate with community members"
        actions={<>
          <Btn kind={requested ? 'soft' : 'primary'} size="md" iconL={requested ? undefined : 'plus'} onClick={() => setRequested(true)}>{requested ? 'Request Sent ✓' : 'Connect'}</Btn>
          <Btn kind="outline" size="md" iconL="chat" onClick={() => window.location.href = '/chat'}>Message</Btn>
        </>}
      />

      {/* Cover */}
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <ImgPh kind="ornament" tone="saffron" height={140}/>
        <div className="mob-stack" style={{ padding: '0 28px 24px', display: 'grid', gridTemplateColumns: '128px 1fr auto', gap: 22, alignItems: 'flex-end' }}>
          <Avatar name={member.name} size={128} style={{ marginTop: -56, fontSize: 44, border: '5px solid #fff', boxShadow: '0 4px 16px rgba(15,14,12,0.1)' }}/>
          <div style={{ paddingTop: 18, minWidth: 0 }}>
            <h2 style={{
              margin: 0, fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink,
              letterSpacing: '-0.03em', display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap',
            }}>
              {member.name}
              <Icon name="verify" size={20} color={C.green}/>
            </h2>
            <div style={{ marginTop: 4, fontSize: 14, color: C.ink2, fontWeight: 500 }}>{member.role}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: C.ink3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="pin" size={13} color={C.ink3}/> {member.city} · from {member.origin}</span>
              <span>·</span>
              <span><strong style={{ color: C.ink, fontWeight: 700 }}>{member.type}</strong> member of {member.mandal}</span>
              <span>·</span>
              <span>Joined {member.joined}</span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {member.open.map(o => <Tag key={o} color={C.green} bg={C.greenLt}>● Open to {o}</Tag>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 18 }}>
            <Btn kind="outline" size="md" onClick={() => {
              if (navigator.share) navigator.share({ title: `${member.name}'s Profile`, url: window.location.href });
              else { navigator.clipboard.writeText(window.location.href); toast.add('Profile link copied!', 'success'); }
            }}><Icon name="share" size={16}/></Btn>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 22 }}>
        <Card pad={28}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>About {member.name.split(' ')[0]}</div>
          <p style={{ margin: 0, fontSize: 15, color: C.ink2, lineHeight: 1.6 }}>{member.bio}</p>
          
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Languages</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {member.langs.map(l => <Pill key={l}>{l}</Pill>)}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '6px 12px', background: C.bgDeep, color: C.ink2, fontSize: 13, fontWeight: 600, borderRadius: 99 }}>
      {children}
    </div>
  );
}
