'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, ImgPh, Avatar, Tag, useGlobalToast } from '@/components/primitives';
import { ContactModal } from '@/components/FormModals';
import type { HousingListing } from '@/data/housing';

export default function HousingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [listing, setListing] = useState<HousingListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const toast = useGlobalToast();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: listing?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.add('Link copied to clipboard!', 'success');
    }
  };

  useEffect(() => {
    fetch('/api/data/housing')
      .then(res => res.json())
      .then((data: HousingListing[]) => {
        const found = Array.isArray(data) ? data.find(h => h.id === id) : null;
        setListing(found ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', color: C.ink3, fontSize: 14 }}>
        Loading listing…
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.ink }}>Listing not found</div>
        <p style={{ margin: 0, fontSize: 14, color: C.ink3, fontWeight: 500 }}>This listing may have been removed or is no longer available.</p>
        <Link href="/housing" style={{ textDecoration: 'none' }}><Btn kind="primary" size="md" iconL="chevL">Back to Housing</Btn></Link>
      </div>
    );
  }

  const img = (listing as any).image as string | undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Link href="/housing" style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.ink3, fontSize: 13, fontWeight: 600, textDecoration: 'none', width: 'fit-content' }}>
        <Icon name="chevL" size={14} color={C.ink3} /> Back to Housing
      </Link>

      <Card pad={0} style={{ overflow: 'hidden' }}>
        <ImgPh kind="housing" height={360} tone={listing.tone} badge={listing.stay} src={img} />
        <div style={{ padding: '32px 36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <h1 style={{ margin: '0 0 12px', fontFamily: F.display, fontSize: 32, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{listing.title}</h1>
              <div style={{ fontSize: 15, color: C.ink2, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="pin" size={16} color={C.ink3} /> {listing.city}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="num" style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: C.saffronDk, letterSpacing: '-0.02em' }}>{listing.rent}</div>
              <div style={{ fontSize: 13, color: C.ink3, fontWeight: 600, marginTop: 4 }}>per month</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <Tag color={C.ink2} bg={C.bgDeep}>{listing.type}</Tag>
            <Tag color={C.ink2} bg={C.bgDeep}>{listing.size}</Tag>
            <Tag color={C.ink2} bg={C.bgDeep}>{listing.gender}</Tag>
            {listing.nearMe && <Tag color={C.green} bg={C.greenLt}>Near you</Tag>}
            {listing.student && <Tag color={C.blue} bg="#DCE5F4">Student-friendly</Tag>}
          </div>

          <div style={{ padding: '24px 0', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={listing.host} size={48} style={{ fontSize: 18 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{listing.host}</div>
              <div style={{ fontSize: 13, color: C.ink3, fontWeight: 500 }}>Community Member · Verified</div>
            </div>
          </div>

          <p style={{ margin: '24px 0 0', fontSize: 15, color: C.ink2, fontWeight: 500, lineHeight: 1.6, maxWidth: 640 }}>
            A {listing.type.toLowerCase()} in {listing.city}, shared by a fellow community member. Reach out directly to ask about availability, house rules, and move-in dates.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <Btn kind="primary" size="lg" iconL="chat" onClick={() => setContactOpen(true)}>Message {listing.host}</Btn>
            <Btn kind={isSaved ? 'primary' : 'outline'} size="lg" style={{ background: isSaved ? C.brick : undefined, borderColor: isSaved ? C.brick : undefined }} onClick={() => setIsSaved(!isSaved)}>
              <Icon name="heart" size={18} color={isSaved ? '#fff' : C.ink}/>
            </Btn>
            <Btn kind="outline" size="lg" onClick={handleShare}><Icon name="share" size={18} color={C.ink}/></Btn>
          </div>
        </div>
      </Card>

      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} title={`Contact ${listing.host}`} subtitle={`Regarding housing (${listing.title})`}/>
    </div>
  );
}
