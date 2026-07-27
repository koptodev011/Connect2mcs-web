'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, ImgPh, Avatar, Tag } from '@/components/primitives';
import type { MarketplaceListing } from '@/data/marketplace';

const conditionStyle: Record<string, { bg: string; fg: string }> = {
  'New':      { bg: C.greenLt, fg: C.green   },
  'Like new': { bg: C.saffronLt, fg: C.saffronDk },
  'Good':     { bg: C.bgDeep,   fg: C.ink2   },
  'Used':     { bg: C.bgDeep,   fg: C.ink3   },
};

export default function MarketplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/marketplace')
      .then(res => res.json())
      .then((data: MarketplaceListing[]) => {
        const found = Array.isArray(data) ? data.find(l => l.id === id) : null;
        setListing(found ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', color: C.ink3, fontSize: 14 }}>
        Loading item…
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.ink }}>Item not found</div>
        <p style={{ margin: 0, fontSize: 14, color: C.ink3, fontWeight: 500 }}>This listing may have been sold or removed.</p>
        <Link href="/marketplace" style={{ textDecoration: 'none' }}><Btn kind="primary" size="md" iconL="chevL">Back to Marketplace</Btn></Link>
      </div>
    );
  }

  const cs = conditionStyle[listing.condition] ?? { bg: C.bgDeep, fg: C.ink2 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Link href="/marketplace" style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.ink3, fontSize: 13, fontWeight: 600, textDecoration: 'none', width: 'fit-content' }}>
        <Icon name="chevL" size={14} color={C.ink3} /> Back to Marketplace
      </Link>

      <Card pad={0} style={{ overflow: 'hidden' }}>
        <ImgPh kind={listing.kind} height={360} tone={listing.tone} src={(listing as any).image} />
        <div style={{ padding: '32px 36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <h1 style={{ margin: '0 0 12px', fontFamily: F.display, fontSize: 32, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{listing.title}</h1>
              <div style={{ fontSize: 15, color: C.ink2, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="pin" size={16} color={C.ink3} /> {listing.city} · Posted {listing.when}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="num" style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: C.saffronDk, letterSpacing: '-0.02em' }}>{listing.price}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <Tag color={cs.fg} bg={cs.bg}>{listing.condition}</Tag>
            <Tag color={C.ink2} bg={C.bgDeep}>{listing.cat}</Tag>
            {listing.featured && <Tag color={C.saffronDk} bg={C.saffronLt}>Featured</Tag>}
          </div>

          <div style={{ padding: '24px 0', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={listing.seller} size={48} style={{ fontSize: 18 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{listing.seller}</div>
              <div style={{ fontSize: 13, color: C.ink3, fontWeight: 500 }}>{listing.mandal} · Verified Member</div>
            </div>
          </div>

          <p style={{ margin: '24px 0 0', fontSize: 15, color: C.ink2, fontWeight: 500, lineHeight: 1.6, maxWidth: 640 }}>
            {(listing as any).desc
              ? (listing as any).desc
              : `Selling my ${listing.title} in ${listing.condition.toLowerCase()} condition. Pickup from ${listing.city}.`}
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <Btn kind="primary" size="lg" iconL="chat">Message Seller</Btn>
            <Btn kind="outline" size="lg"><Icon name="heart" size={18} color={C.ink}/></Btn>
            <Btn kind="outline" size="lg"><Icon name="share" size={18} color={C.ink}/></Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
