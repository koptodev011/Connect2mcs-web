'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Card, ImgPh, SectionHead, PageHeader } from '@/components/primitives';
import type { NewspaperPaper } from '@/data/newspaper';
import styles from './page.module.css';

export default function NewspaperPage() {
  const [papersData, setPapersData] = useState<NewspaperPaper[]>([]);

  useEffect(() => {
    fetch('/api/data/newspapers')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPapersData(data);
          return;
        }

        const tones: NewspaperPaper['tone'][] = ['blue', 'brick', 'saffron', 'green', 'gold'];
        const records = Array.isArray(data?.records) ? data.records : [];
        setPapersData(records.map((record: Record<string, unknown>, index: number) => {
          const logo = record.Logo_ID as { data?: string; id?: number } | undefined;
          const id = String(record.id ?? record.Value ?? index);
          const name = String(record.Name ?? record.Value ?? 'Paper');
          return {
            id,
            name,
            dev: String(record.MCS_DevanagariName ?? name),
            est: Number(record.MCS_Establishment_Year ?? 1900),
            city: String(record.MCS_CityOfPublication ?? 'Maharashtra'),
            desc: String(record.Description ?? 'Marathi daily newspaper.'),
            url: typeof record.URL === 'string' ? record.URL : '#',
            readers: String(record.MCS_Total_NewsReaders ?? '100K'),
            tone: tones[index % tones.length],
            image: logo?.data
              ? `data:image/jpeg;base64,${logo.data}`
              : logo?.id ? `/api/image/${logo.id}` : undefined,
          };
        }));
      })
      .catch(console.error);
  }, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Marathi Newspaper"
        marathi="वृत्तपत्र"
        subtitle="5 major Marathi dailies Â· today's top stories Â· updated every morning"
      />

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
      </section>
    </div>
  );
}