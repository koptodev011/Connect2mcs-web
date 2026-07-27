'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, ImgPh, useGlobalToast } from '@/components/primitives';

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  // Hardcoded group data for demonstration based on the name passed
  // In a real app, we'd fetch this from the API based on ID
  const groupName = decodeURIComponent(id).replace(/-/g, ' ');
  const [joined, setJoined] = useState(false);
  const [likes, setLikes] = useState<Set<number>>(new Set());
  const [replyOpen, setReplyOpen] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const toast = useGlobalToast();

  const toggleLike = (i: number) => setLikes(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    toast.add('Reply posted successfully!', 'success');
    setReplyText('');
    setReplyOpen(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Link href="/community" style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.ink3, fontSize: 13, fontWeight: 600, textDecoration: 'none', width: 'fit-content' }}>
        <Icon name="chevL" size={14} color={C.ink3} /> Back to Community
      </Link>
      
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <ImgPh kind="group" height={160} tone="pink" />
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.2, textTransform: 'capitalize' }}>
                {groupName}
              </h1>
              <div style={{ fontSize: 13, color: C.ink2, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="user" size={14} color={C.ink3} /> 142 Members · Public Group
              </div>
            </div>
            <Btn kind={joined ? 'soft' : 'primary'} size="md" iconL={joined ? 'check' : 'plus'} onClick={() => setJoined(!joined)}>
              {joined ? 'Joined' : 'Join Group'}
            </Btn>
          </div>
          
          <p style={{ margin: '20px 0 0', fontSize: 14, color: C.ink2, fontWeight: 500, lineHeight: 1.5 }}>
            Welcome to the {groupName} group! This is a dedicated space to discuss relevant topics, share resources, and connect with like-minded individuals in the community.
          </p>

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recent Discussions</div>
            {[
              { author: 'Rahul Deshmukh', time: '2 hours ago', title: 'Looking for recommendations', content: 'Does anyone know a good place to find authentic Maharashtrian groceries in the downtown area?' },
              { author: 'Sneha Kulkarni', time: 'Yesterday', title: 'Upcoming meetup details', content: 'Just a reminder that our next group meetup is this Saturday at 4 PM. We will be meeting at the central library.' }
            ].map((post, i) => (
              <div key={i} style={{ padding: '16px 20px', borderRadius: 12, border: `1px solid ${C.line}`, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Link href={`/profile/${encodeURIComponent(post.author)}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.saffronLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.saffronDk, fontWeight: 700, fontSize: 12 }}>
                      {post.author.charAt(0)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{post.author}</div>
                  </Link>
                  <div style={{ fontSize: 11, color: C.ink4, fontWeight: 500 }}>{post.time}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{post.title}</div>
                <div style={{ fontSize: 13, color: C.ink2, lineHeight: 1.5 }}>{post.content}</div>
                <div style={{ marginTop: 14, display: 'flex', gap: 16 }}>
                  <button onClick={() => toggleLike(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: likes.has(i) ? C.brick : C.ink3, fontWeight: 600, padding: 0 }}>
                    <Icon name="heart" size={14} color={likes.has(i) ? C.brick : C.ink3}/> {likes.has(i) ? 'Liked' : 'Like'}
                  </button>
                  <button onClick={() => setReplyOpen(replyOpen === i ? null : i)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: replyOpen === i ? C.saffronDk : C.ink3, fontWeight: 600, padding: 0 }}>
                    <Icon name="chat" size={14}/> Reply
                  </button>
                </div>
                {replyOpen === i && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}`, display: 'flex', gap: 10 }}>
                    <input 
                      type="text" 
                      placeholder="Write a reply..." 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit()}
                      autoFocus
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 13, outline: 'none' }} 
                    />
                    <Btn kind="primary" size="md" onClick={handleReplySubmit}>Post</Btn>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
