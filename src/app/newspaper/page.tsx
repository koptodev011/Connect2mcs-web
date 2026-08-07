'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { C } from '@/lib/tokens';
import { Card, ImgPh, SectionHead, PageHeader } from '@/components/primitives';
import type { NewspaperPaper } from '@/data/newspaper';
import styles from './page.module.css';

const NEWSPAPER_PAGE_SIZE = 10;

export default function NewspaperPage() {
  const [papersData, setPapersData] = useState<NewspaperPaper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [paperPage, setPaperPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPapersData([]);
      setPaperPage(0);
      setHasMore(true);
      setLoading(true);
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const offset = paperPage * NEWSPAPER_PAGE_SIZE;
    const query = encodeURIComponent(debouncedQuery);

    fetch(`/api/data/newspapers?top=${NEWSPAPER_PAGE_SIZE}&skip=${offset}&q=${query}`, {
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) throw new Error('Unable to load newspapers');
        return response.json();
      })
      .then(data => {
        const nextPapers: NewspaperPaper[] = Array.isArray(data) ? data : [];
        setPapersData(current => {
          if (paperPage === 0) return nextPapers;
          const existingIds = new Set(current.map(paper => paper.id));
          return [...current, ...nextPapers.filter(paper => !existingIds.has(paper.id))];
        });
        setHasMore(nextPapers.length === NEWSPAPER_PAGE_SIZE);
      })
      .catch(error => {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error(error);
          setHasMore(false);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [paperPage, debouncedQuery]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || loading || !hasMore) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        observer.disconnect();
        setLoading(true);
        setPaperPage(current => current + 1);
      }
    }, { rootMargin: '240px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, hasMore]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Marathi Newspaper"
        marathi="वृत्तपत्र"
        subtitle="5 major Marathi dailies Â· today's top stories Â· updated every morning"
      />

      <Card pad={14} className={styles.searchCard}>
        <div className={styles.searchField}>
          <Icon name="search" size={16} color={C.ink3} />
          <input
            className={styles.searchInput}
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search newspapers"
          />
        </div>
      </Card>
      <section>
        <SectionHead title="All Marathi papers" subtitle="Quick stats on Maharashtra's major dailies" />
        <div className={styles.paperGrid}>
          {papersData.map(paper => (
            <Card
              key={paper.id}
              pad={0}
              interactive
              className={styles.paperCard}
              onClick={() => { if (paper.url && paper.url !== '#') window.open(paper.url, '_blank'); }}
            >
              {paper.image ? (
                <div className={styles.imageFrame}>
                  <Image className={styles.paperImage} src={paper.image} alt={paper.name} fill unoptimized />
                </div>
              ) : (
                <ImgPh kind="news" tone={paper.tone} height={150} />
              )}
              <div className={styles.paperContent}>
                <div className={styles.paperName}>{paper.dev}</div>
              </div>
            </Card>
          ))}
        </div>
        <div ref={loadMoreRef} className={styles.loadMore} aria-hidden="true" />
        {loading && <p className={styles.loadingText}>Loading more newspapersâ€¦</p>}
        {!loading && papersData.length === 0 && <p className={styles.emptyText}>No newspapers found.</p>}
      </section>
    </div>
  );
}