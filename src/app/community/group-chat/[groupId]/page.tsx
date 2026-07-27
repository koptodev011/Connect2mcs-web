'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function GroupChatPage({ params }: { params: Promise<{ groupId: string }> }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;
  const router = useRouter();

  useEffect(() => {
    if (groupId) {
      router.replace(`/chat?chatId=${groupId}`);
    }
  }, [groupId, router]);

  return <div style={{ padding: 40, textAlign: 'center' }}>Redirecting to group chat...</div>;
}
