'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Btn, Card, PageHeader, useGlobalToast } from '@/components/primitives';
import styles from './page.module.css';

export default function OfferClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const toast = useGlobalToast();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    const { id } = await params;
    const token = new URL(window.location.href).searchParams.get('token') || '';
    let user: { id?: number | string; isGuest?: boolean } = {};
    try { user = JSON.parse(localStorage.getItem('mcs_user') || '{}'); } catch {}
    if (!Number(user.id) || user.isGuest) {
      localStorage.setItem('mcs_login_return', `/offers/claim/${id}`);
      router.push('/login');
      return;
    }

    setClaiming(true);
    try {
      const response = await fetch('/api/v1/models/MCS_OfferClaim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MCS_Offers_ID: Number(id), token }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not claim offer');
      setClaimed(true);
      toast.add(result.alreadyClaimed ? 'You already claimed this offer.' : 'Offer claimed successfully!', 'success');
    } catch (error) {
      toast.add(error instanceof Error ? error.message : 'Could not claim offer.', 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Claim offer" marathi={'\u0911\u092b\u0930 \u0915\u094d\u0932\u0947\u092e'} subtitle="Scan confirmed. Sign in and claim this member offer." />
      <Card pad={32} className={styles.card}>
        <div className={styles.icon}>%</div>
        <h2>{claimed ? 'Offer claimed' : 'Ready to claim this offer?'}</h2>
        <p>{claimed ? 'This offer is now linked to your account.' : 'Claims are linked to your Connect2MCS account and can only be submitted once.'}</p>
        <Btn kind="primary" size="lg" disabled={claiming || claimed} onClick={() => void handleClaim()}>
          {claiming ? 'Claiming...' : claimed ? 'Claimed' : 'Claim offer'}
        </Btn>
      </Card>
    </div>
  );
}