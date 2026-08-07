'use client';

import { useState } from 'react';
import { C } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, ImgPh, SectionHead, PageHeader } from '@/components/primitives';
import { ArticleModal, NotifyMeModal } from '@/components/FormModals';
import { newsStories } from '@/data/news';
import styles from './page.module.css';

const cats = ['All', 'Community', 'Culture', 'Education', 'Cuisine', 'Arts', 'Sports', 'Diaspora'];

export default function NewsPage() {
  const [active, setActive] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Recent');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<(typeof newsStories)[number] | null>(null);

  const featured = newsStories.find(story => story.featured) ?? newsStories[0];
  const filteredStories = newsStories
    .filter(story => {
      const matchesCategory = active === 'All' || story.cat === active;
      const normalizedQuery = searchQuery.toLowerCase();
      const matchesQuery = !searchQuery
        || story.title.toLowerCase().includes(normalizedQuery)
        || story.excerpt.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    })
    .filter(story => (active === 'All' && !searchQuery) ? !story.featured : true);

  const sortedStories = [...filteredStories].sort((a, b) => {
    if (sortBy === 'Popular') {
      const readA = parseInt(a.read.replace(/\D/g, '')) || 0;
      const readB = parseInt(b.read.replace(/\D/g, '')) || 0;
      return readB - readA;
    }
    return 0;
  });

  return (
    <div className={styles.page}>
      <PageHeader
        title="News"
        marathi="बातम्या"
        subtitle="Stories from the global Marathi community Â· updated daily"
      />

      <Card pad={14} className={styles.searchCard}>
        <div className={styles.searchField}>
          <Icon name="search" size={16} color={C.ink3} />
          <input
            className={styles.searchInput}
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search stories, interviews, reportsâ€¦"
          />
        </div>
      </Card>

      <div className={styles.categories}>
        {cats.map(category => (
          <Pill key={category} active={active === category} onClick={() => setActive(category)}>
            {category}
          </Pill>
        ))}
      </div>

      {featured && active === 'All' && !searchQuery && (
        <Card pad={0} interactive className={styles.featuredCard}>
          <div className={styles.featuredImage}>
            <ImgPh kind="news" tone={featured.tone} height="100%" />
          </div>
          <div className={styles.featuredContent}>
            <Tag color={C.brick} bg="#FAE0DA" className={styles.featuredTag}>
              Featured Â· {featured.cat}
            </Tag>
            <h2 className={styles.featuredTitle}>{featured.title}</h2>
            <p className={styles.featuredExcerpt}>{featured.excerpt}</p>
            <div className={styles.featuredMeta}>
              <strong>{featured.author}</strong>
              <span>Â·</span><span>{featured.when}</span>
              <span>Â·</span><span>{featured.read}</span>
            </div>
            <div className={styles.featuredAction}>
              <Btn kind="primary" size="md" onClick={() => { setSelectedArticle(featured); setArticleOpen(true); }}>
                Read full story
              </Btn>
            </div>
          </div>
        </Card>
      )}

      <section>
        <SectionHead
          title="Latest stories"
          subtitle="Fresh from across the diaspora"
          action={
            <select className={styles.sortSelect} value={sortBy} onChange={event => setSortBy(event.target.value)}>
              <option value="Recent">Sort: Recent</option>
              <option value="Popular">Sort: Popular</option>
            </select>
          }
        />
        <div className={styles.storyGrid}>
          {sortedStories.map((story, index) => (
            <Card
              key={index}
              pad={0}
              interactive
              className={styles.storyCard}
              onClick={() => { setSelectedArticle(story); setArticleOpen(true); }}
            >
              <ImgPh kind="news" tone={story.tone} height={160} />
              <div className={styles.storyContent}>
                <Tag color={C.saffronDk} bg={C.saffronLt}>{story.cat}</Tag>
                <h4 className={styles.storyTitle}>{story.title}</h4>
                <p className={styles.storyExcerpt}>{story.excerpt}</p>
                <div className={styles.storyMeta}>{story.author} Â· {story.when} Â· {story.read}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <ArticleModal isOpen={articleOpen} onClose={() => setArticleOpen(false)} story={selectedArticle} />
      <NotifyMeModal isOpen={notifyOpen} onClose={() => setNotifyOpen(false)} />
    </div>
  );
}