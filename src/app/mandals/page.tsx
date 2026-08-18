"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import { ImgPh } from "@/components/primitives";
import { Mandal } from "@/data/mandals";
import heroImage from "../../../public/images/mandals/worldwide-hero.png";
import styles from "./page.module.css";

const PAGE_SIZE = 12;

export default function MandalsPage() {
  const [mandalsData, setMandalsData] = useState<Mandal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/data/mandals")
      .then((response) => response.json())
      .then((data) => setMandalsData(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredMandals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return mandalsData.filter(
      (mandal) =>
        !query ||
        mandal.name.toLowerCase().includes(query) ||
        mandal.city.toLowerCase().includes(query),
    );
  }, [mandalsData, searchQuery]);

  const visibleMandals = filteredMandals.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMandals.length;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) =>
            Math.min(count + PAGE_SIZE, filteredMandals.length),
          );
        }
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, filteredMandals.length]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Image
          className={styles.heroImage}
          src={heroImage}
          alt="Marathi Mandals connected across the world"
          priority
          sizes="(max-width: 900px) 100vw, 1200px"
        />
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}>
          <h1>Marathi Mandals Worldwide</h1>
          <p>Stronger Together, Wherever We Are</p>
          <span>महाराष्ट्र मंडळे</span>
        </div>
      </section>

      <div className={styles.searchField}>
        <Icon name="search" size={17} color="#6B6256" />
        <input
          className={styles.searchInput}
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search mandals by name or city…"
          aria-label="Search mandals by name or city"
        />
      </div>

      <section aria-label="Marathi Mandals">
        <div className={styles.grid}>
          {loading ? (
            <div className={styles.status}>
              Loading mandals from iDempiere...
            </div>
          ) : filteredMandals.length === 0 ? (
            <div className={styles.status}>
              <h2>No mandals found</h2>
              <p>Try adjusting your search.</p>
            </div>
          ) : (
            visibleMandals.map((mandal, index) => (
              <Link
                className={styles.mandalCard}
                key={`${mandal.code}-${index}`}
                href={`/mandals/${mandal.code}`}
              >
                <div className={styles.logo}>
                  <ImgPh
                    kind="mandal"
                    label={mandal.code}
                    height={76}
                    tone={mandal.tone}
                    src={mandal.image}
                  />
                </div>

                <div className={styles.identity}>
                  <h2>{mandal.name}</h2>
                  <p>
                    {mandal.city}
                    {mandal.region ? `, ${mandal.region}` : ""}
                    {mandal.country ? `, ${mandal.country}` : ""}
                  </p>
                </div>

                <div className={styles.stats}>
                  <span>
                    <Icon name="cal" size={17} color="#3A342B" />
                    {mandal.events} Events
                  </span>
                  <span>
                    <Icon name="people" size={17} color="#3A342B" />
                    {mandal.members.toLocaleString()} Members
                  </span>
                </div>

                <Icon name="chevR" size={20} color="#6B6256" />
              </Link>
            ))
          )}
        </div>

        {hasMore && (
          <div
            ref={loadMoreRef}
            className={styles.loadMoreSentinel}
            aria-hidden="true"
          />
        )}
      </section>
    </main>
  );
}
