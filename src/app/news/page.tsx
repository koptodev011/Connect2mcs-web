'use client';

import { useEffect, useRef, useState } from 'react';
import { C } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, ImgPh, SectionHead, PageHeader } from '@/components/primitives';
import { ArticleModal, NotifyMeModal } from '@/components/FormModals';
import type { NewsStory } from '@/data/news';
import styles from './page.module.css';


const NEWS_PAGE_SIZE = 9;

export default function NewsPage() {
  const [cats, setCats] = useState<string[]>(['All']);
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [newsPage, setNewsPage] = useState(0);
  const [newsLoading, setNewsLoading] = useState(true);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Recent');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsStory | null>(null);
  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/data/news-categories', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Unable to load news categories');
        return response.json();
      })
      .then((categories: Array<{ id: string; name: string }>) => {
        const names = categories
          .map(category => category.name.trim())
          .filter(Boolean);
        setCats(['All', ...Array.from(new Set(names))]);
      })
      .catch(error => {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error(error);
        }
      });

    return () => controller.abort();
  }, []);


  useEffect(() => {
    const controller = new AbortController();
    const offset = newsPage * NEWS_PAGE_SIZE;

    fetch(`/api/data/news?top=${NEWS_PAGE_SIZE}&skip=${offset}`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Unable to load news stories');
        return response.json();
      })
      .then((data: NewsStory[]) => {
        const nextStories = Array.isArray(data) ? data : [];
        setStories(current => {
          if (newsPage === 0) return nextStories;
          const existingIds = new Set(current.map(story => story.id));
          return [...current, ...nextStories.filter(story => !existingIds.has(story.id))];
        });
        setHasMoreNews(nextStories.length === NEWS_PAGE_SIZE);
      })
      .catch(error => {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error(error);
          setHasMoreNews(false);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setNewsLoading(false);
      });

    return () => controller.abort();
  }, [newsPage]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || newsLoading || !hasMoreNews) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        observer.disconnect();
        setNewsLoading(true);
        setNewsPage(current => current + 1);
      }
    }, { rootMargin: '240px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [newsLoading, hasMoreNews]);
  const featured = stories.find(story => story.featured) ?? stories[0];
  const filteredStories = stories
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
              Featured {featured.cat}
            </Tag>
            <h2 className={styles.featuredTitle}>{featured.title}</h2>
            <p className={styles.featuredExcerpt}>{featured.excerpt}</p>
            <div className={styles.featuredMeta}>
              <strong>{featured.author}</strong>
              {/* <span>Â·</span><span>{featured.when}</span>
              <span>Â·</span><span>{featured.read}</span> */}
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
                <div className={styles.storyMeta}>{story.author}</div>
              </div>
            </Card>
          ))}
        </div>
        <div ref={loadMoreRef} className={styles.loadMore} aria-hidden="true" />
        {newsLoading && <p className={styles.loadingText}>Loading more storiesâ€¦</p>}
      </section>

      <ArticleModal isOpen={articleOpen} onClose={() => setArticleOpen(false)} story={selectedArticle} />
      <NotifyMeModal isOpen={notifyOpen} onClose={() => setNotifyOpen(false)} />
    </div>
  );
}