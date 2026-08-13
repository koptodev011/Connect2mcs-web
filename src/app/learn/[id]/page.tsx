'use client';

import { useEffect, useRef, useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import { Btn, Card, Tag, ImgPh, PageHeader } from '@/components/primitives';
import { ApplyModal } from '@/components/FormModals';
import type { Scholarship, Internship } from '@/data/learn';
import styles from './page.module.css';

type DetailItem = (Scholarship & { type: 'scholarship' }) | (Internship & { type: 'internship' });

const RELATED_PAGE_SIZE = 4;

export default function LearnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<DetailItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<DetailItem[]>([]);
  const [visibleRelated, setVisibleRelated] = useState(RELATED_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/data/scholarships').then(res => res.json()),
      fetch('/api/data/internships').then(res => res.json()),
    ])
      .then(([sData, iData]) => {
        setVisibleRelated(RELATED_PAGE_SIZE);
        const scholarships = Array.isArray(sData) ? sData as Scholarship[] : [];
        const internships = Array.isArray(iData) ? iData as Internship[] : [];
        const scholarship = scholarships.find(candidate => candidate.id === id);
        const internship = internships.find(candidate => candidate.id === id);
        setItem(scholarship ? { ...scholarship, type: 'scholarship' } : internship ? { ...internship, type: 'internship' } : null);
        setRelatedItems([
          ...scholarships.filter(candidate => candidate.id !== id).map(candidate => ({ ...candidate, type: 'scholarship' as const })),
          ...internships.filter(candidate => candidate.id !== id).map(candidate => ({ ...candidate, type: 'internship' as const })),
        ]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        setVisibleRelated(count => Math.min(count + RELATED_PAGE_SIZE, relatedItems.length));
      }
    }, { rootMargin: '240px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [relatedItems.length, visibleRelated]);

  if (loading) return <div className={styles.loading}>Loading details...</div>;
  if (!item) return notFound();

  const isScholarship = item.type === 'scholarship';
  const title = isScholarship ? item.title : item.role;
  const org = isScholarship ? item.org : item.co;
  const handleApply = () => {
    if (applied) return;
    if (item.applyUrl) {
      window.location.assign(item.applyUrl);
      return;
    }
    setApplyOpen(true);
  };

  return (
    <div className={styles.page}>
      <div>
        <Link href="/learn" className={styles.backLink}><Icon name="chevL" size={14}/> Back to Learn</Link>
        <PageHeader title={title} subtitle={`Offered by ${org}`} actions={<Btn kind={applied ? 'soft' : 'primary'} size="lg" onClick={handleApply}>{applied ? 'Application Submitted ✓' : 'Apply Now'}</Btn>}/>
      </div>

      <div className={`${styles.detailGrid} mob-stack`}>
        <div className={styles.mainContent}>
          <ImgPh height={280} tone={item.tone} label={title}/>
          <Card pad={32}>
            <h3 className={styles.aboutTitle}>About the Opportunity</h3>
            <p className={styles.description}>This {isScholarship ? 'scholarship' : 'internship'} is designed for exceptional individuals looking to advance their career and education. Successful candidates will demonstrate strong commitment to their field and our community values.</p>
            <h3 className={styles.criteriaTitle}>Eligibility Criteria</h3>
            <ul className={styles.criteriaList}>
              <li>Must be of Marathi origin or heavily involved in the community.</li>
              {isScholarship ? <><li>Pursuing studies in {item.field}.</li><li>Exceptional academic standing.</li></> : <><li>Available for the entire {item.dur} duration.</li><li>Based in {item.loc} or willing to relocate/work remotely as specified.</li></>}
            </ul>
          </Card>
        </div>

        <aside className={styles.sidebar}>
          <Card pad={24}>
            <div className={styles.amountBlock}><div className={styles.metaLabel}>{isScholarship ? 'Award Amount' : 'Stipend'}</div><div className={`${styles.amount} num`}>{isScholarship ? item.amount : item.stipend}</div></div>
            {isScholarship ? <>
              <Meta label="Field of Study" value={item.field}/>
              <Meta label="Deadline" value={item.deadline} urgent/>
              <div><div className={styles.metaLabel}>Status</div>{item.eligible ? <Tag color="#1F7A3A" bg="#E1F2E6">● Eligible</Tag> : <Tag color="#A8321F" bg="#FAE0DA">● Closed</Tag>}</div>
            </> : <><Meta label="Location" value={item.loc}/><Meta label="Duration" value={`${item.dur} (${item.when})`}/></>}
            <div className={styles.applyBlock}><Btn kind={applied ? 'soft' : 'primary'} size="lg" full onClick={handleApply}>{applied ? 'Application Submitted ✓' : 'Apply Now'}</Btn></div>
          </Card>
        </aside>
      </div>

      {relatedItems.length > 0 && <section className={styles.relatedSection}>
        <div className={styles.relatedHeading}><h2>More opportunities</h2><span>{relatedItems.length} available</span></div>
        <div className={styles.relatedGrid}>
          {relatedItems.slice(0, visibleRelated).map(related => {
            const scholarship = related.type === 'scholarship';
            const relatedTitle = scholarship ? related.title : related.role;
            const relatedOrg = scholarship ? related.org : related.co;
            return <Link href={`/learn/${related.id}`} key={`${related.type}-${related.id}`} className={styles.relatedLink}><Card pad={0} interactive className={styles.relatedCard}><ImgPh height={120} tone={related.tone} label={relatedTitle}/><div className={styles.relatedBody}><Tag>{scholarship ? 'Scholarship' : 'Internship'}</Tag><h3>{relatedTitle}</h3><p>{relatedOrg}</p><strong>{scholarship ? related.amount : related.stipend}</strong></div></Card></Link>;
          })}
        </div>
        {visibleRelated < relatedItems.length && <div ref={loadMoreRef} className={styles.loadMore} aria-label="Loading more opportunities"><span/></div>}
      </section>}

      <ApplyModal isOpen={applyOpen} onClose={() => setApplyOpen(false)} itemName={title} onSubmit={() => setApplied(true)}/>
    </div>
  );
}

function Meta({ label, value, urgent = false }: { label: string; value: string; urgent?: boolean }) {
  return <div className={styles.metaBlock}><div className={styles.metaLabel}>{label}</div><div className={urgent ? styles.urgentValue : styles.metaValue}>{value}</div></div>;
}
