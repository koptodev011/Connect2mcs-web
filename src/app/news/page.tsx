'use client';

import { useState, useEffect } from 'react';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, ImgPh, SectionHead, PageHeader } from '@/components/primitives';
import { ArticleModal, NotifyMeModal } from '@/components/FormModals';
import { newsStories } from '@/data/news';
import type { NewspaperPaper } from '@/data/newspaper';

const cats = ['All', 'Community', 'Culture', 'Education', 'Cuisine', 'Arts', 'Sports', 'Diaspora'];

type Tab = 'news' | 'newspaper';

export default function NewsPage() {
  const [tab, setTab] = useState<Tab>('news');
  const [active, setActive] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Recent');
  
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  
  // Newspaper state
  const [papersData, setPapersData] = useState<NewspaperPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/newspapers')
      .then(res => res.json())
      .then(data => {
        setPapersData(data);

        setLoading(false);
      })
      .catch(console.error);
  }, []);

  // News logic — fall back to the first story so a missing "featured" flag
  // never throws at runtime.
  const featured = newsStories.find(s => s.featured) ?? newsStories[0];
  const filteredStories = newsStories.filter(s => {
    const matchCat = active === 'All' || s.cat === active;
    const matchQ = !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQ;
  }).filter(s => (active === 'All' && !searchQuery) ? !s.featured : true);
  
  const sortedStories = [...filteredStories].sort((a, b) => {
    if (sortBy === 'Popular') {
      const readA = parseInt(a.read.replace(/\D/g, '')) || 0;
      const readB = parseInt(b.read.replace(/\D/g, '')) || 0;
      return readB - readA;
    }
    return 0; // Recent
  });


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title={tab === 'news' ? "News" : "Marathi Newspaper"}
        marathi={tab === 'news' ? "बातम्या" : "वृत्तपत्र"}
        subtitle={tab === 'news' ? "Stories from the global Marathi community · updated daily" : "5 major Marathi dailies · today's top stories · updated every morning"}
        actions={
          tab === 'news' ? (
            <>
              <Btn kind="ghost" size="md" iconL="bell" onClick={() => setNotifyOpen(true)}>Subscribe</Btn>
              <Btn kind="dark" size="md" iconL="plus" onClick={() => { window.location.href = 'mailto:editor@connect2mcs.com'; }}>Submit a story</Btn>
            </>
          ) : (
            <>
              <Btn kind="ghost" size="md" iconL="bell" onClick={() => setNotifyOpen(true)}>Subscribe to digest</Btn>
              <Btn kind="dark" size="md" iconL="plus" onClick={() => { window.location.href = 'mailto:editor@connect2mcs.com'; }}>Submit a story</Btn>
            </>
          )
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.line}`, padding: '0 4px' }}>
        {(['news', 'newspaper'] as Tab[]).map(t => {
          const isActive = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} className={isActive ? undefined : 'nav-int'} style={{
              padding: '12px 20px', background: 'transparent', border: 'none',
              fontSize: 14, fontWeight: isActive ? 700 : 600,
              color: isActive ? C.saffronDk : C.ink2,
              borderBottom: `2px solid ${isActive ? C.saffron : 'transparent'}`,
              marginBottom: -1, cursor: 'pointer', textTransform: 'capitalize',
              fontFamily: F.ui, letterSpacing: '-0.005em',
            }}>
              {t === 'news' ? 'Community News' : 'Daily Newspapers'}
            </button>
          );
        })}
      </div>

      {tab === 'news' ? (
        <>
          <Card pad={14} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: C.bgDeep, borderRadius: 10 }}>
              <Icon name="search" size={16} color={C.ink3}/>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories, interviews, reports…" 
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit' }}
              />
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {cats.map(c => <Pill key={c} active={active === c} onClick={() => setActive(c)}>{c}</Pill>)}
          </div>

          {/* Featured (only show if no filters applied) */}
          {featured && active === 'All' && !searchQuery && (
          <Card pad={0} interactive className="mob-stack" style={{ overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <ImgPh kind="news" tone={featured.tone} height="auto" style={{ minHeight: 320 }}/>
            <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Tag color={C.brick} bg="#FAE0DA" style={{ alignSelf: 'flex-start' }}>Featured · {featured.cat}</Tag>
              <h2 style={{ margin: '14px 0 12px', fontFamily: F.display, fontSize: 30, fontWeight: 600, color: C.ink, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                {featured.title}
              </h2>
              <p style={{ margin: '0 0 18px', fontSize: 15, color: C.ink2, fontWeight: 500, lineHeight: 1.55 }}>
                {featured.excerpt}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: C.ink3, fontWeight: 500 }}>
                <strong style={{ color: C.ink, fontWeight: 700 }}>{featured.author}</strong>
                <span>·</span><span>{featured.when}</span>
                <span>·</span><span>{featured.read}</span>
              </div>
              <div style={{ marginTop: 22 }}>
                <Btn kind="primary" size="md" onClick={() => { setSelectedArticle(featured); setArticleOpen(true); }}>Read full story</Btn>
              </div>
            </div>
          </Card>
          )}

          {/* Story grid */}
          <section>
            <SectionHead 
              title="Latest stories" 
              subtitle="Fresh from across the diaspora" 
              action={
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ appearance: 'none', background: 'transparent', border: 'none', color: C.saffronDk, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                  <option value="Recent">Sort: Recent</option>
                  <option value="Popular">Sort: Popular</option>
                </select>
              }
            />
            <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {sortedStories.map((s, i) => (
                <Card key={i} pad={0} interactive style={{ overflow: 'hidden' }} onClick={() => { setSelectedArticle(s); setArticleOpen(true); }}>
                  <ImgPh kind="news" tone={s.tone} height={160}/>
                  <div style={{ padding: '16px 18px 18px' }}>
                    <Tag color={C.saffronDk} bg={C.saffronLt}>{s.cat}</Tag>
                    <h4 style={{ margin: '10px 0 8px', fontFamily: F.display, fontSize: 17, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.3 }}>{s.title}</h4>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: C.ink2, fontWeight: 500, lineHeight: 1.5 }}>{s.excerpt}</p>
                    <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 600 }}>{s.author} · {s.when} · {s.read}</div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>

          {/* Browse all papers */}
          <section>
            <SectionHead title="All Marathi papers" subtitle="Quick stats on Maharashtra's major dailies"/>
            <div className="mob-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {papersData.map((p) => (
                <Card key={p.id} pad={0} interactive style={{ overflow: 'hidden' }} onClick={() => { if (p.url && p.url !== '#') window.open(p.url, '_blank'); }}>
                  {(p as any).image ? (
                    <div style={{ height: 80, overflow: 'hidden' }}>
                      <img src={(p as any).image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    </div>
                  ) : (
                    <ImgPh kind="news" tone={p.tone} height={80}/>
                  )}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontFamily: F.deva, fontSize: 18, color: C.saffronDk, fontWeight: 400 }}>{p.dev}</div>
                    <div style={{ fontFamily: F.display, fontSize: 12, fontWeight: 600, color: C.ink, marginTop: 2 }}>{p.id}</div>
                    <div style={{ fontSize: 11, color: C.ink3, fontWeight: 500, marginTop: 4 }}>{p.readers}</div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}

      <ArticleModal isOpen={articleOpen} onClose={() => setArticleOpen(false)} story={selectedArticle} />
      <NotifyMeModal isOpen={notifyOpen} onClose={() => setNotifyOpen(false)} />
    </div>
  );
}
