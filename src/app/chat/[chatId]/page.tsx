'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function DirectChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const resolvedParams = use(params);
  const chatId = resolvedParams.chatId;
  const router = useRouter();

  useEffect(() => {
    if (chatId) {
      router.replace(`/chat?chatId=${chatId}`);
    }
  }, [chatId, router]);

  return <div style={{ padding: 40, textAlign: 'center' }}>Redirecting to chat...</div>;
}
