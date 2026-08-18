"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { Card, ImgPh, Rating, Tag } from "@/components/primitives";
import { Mandal } from "@/data/mandals";
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
      .then((res) => res.json())
      .then((data) => setMandalsData(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return mandalsData.filter(
      (mandal) =>
        !query ||
        mandal.name.toLowerCase().includes(query) ||
        mandal.city.toLowerCase().includes(query),
    );
  }, [mandalsData, searchQuery]);

  const visibleMandals = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting)
          setVisibleCount((count) =>
            Math.min(count + PAGE_SIZE, filtered.length),
          );
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, filtered.length]);

  return (
    <div className={styles.page}>
      {/* महाराष्ट्र मंडळे */}
      <Card pad={14} className={styles.searchCard}>
        <div className={styles.searchField}>
          <Icon name="search" size={16} color="#6B6256" />
          <input
            className={styles.searchInput}
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search mandals by name or city…"
          />
        </div>
      </Card>
      <section>
        <div className={styles.grid}>
          {loading ? (
            <div className={styles.status}>
              Loading mandals from iDempiere...
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.status}>
              <div className={styles.emptyTitle}>No mandals found</div>
              <p className={styles.emptyText}>
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            visibleMandals.map((m, index) => (
              <Link
                className={styles.mandalLink}
                key={`${m.code}-${index}`}
                href={`/mandals/${m.code}`}
              >
                <Card pad={0} interactive className={styles.mandalCard}>
                  <ImgPh
                    kind="mandal"
                    label={m.code}
                    showLabel
                    height={130}
                    tone={m.tone}
                    badge={m.hosting ? "Hosting" : null}
                    src={m.image}
                  />
                  <div className={styles.cardBody}>
                    <div className={styles.cardHeading}>
                      <div className={styles.titleBlock}>
                        <div className={styles.titleRow}>
                          <div className={styles.mandalName}>{m.name}</div>
                          {m.home && (
                            <Tag
                              color="#1F4DA8"
                              bg="#DCE5F4"
                              className={styles.tag}
                            >
                              Home
                            </Tag>
                          )}
                          {m.nearMe && (
                            <Tag
                              color="#1F7A3A"
                              bg="#E1F2E6"
                              className={styles.tag}
                            >
                              Near You
                            </Tag>
                          )}
                        </div>
                        <div className={styles.location}>
                          {m.city}, {m.region ? `${m.region}, ` : ""}
                          {m.country} · Est. {m.est}
                        </div>
                      </div>
                      {m.rating > 0 && <Rating value={m.rating} />}
                    </div>
                    {m.about ? (
                      <div className={styles.about}>{m.about}</div>
                    ) : (
                      <div className={styles.aboutFallback}>
                        A community organization fostering Marathi culture in{" "}
                        {m.city}.
                      </div>
                    )}
                    <div className={styles.metaRow}>
                      <div className={styles.metrics}>
                        {m.members > 0 && (
                          <span className={styles.metric}>
                            <Icon name="people" size={14} color="#6B6256" />{" "}
                            {m.members.toLocaleString()}
                          </span>
                        )}
                        {m.events > 0 && (
                          <span className={styles.metric}>
                            <Icon name="cal" size={14} color="#6B6256" />{" "}
                            {m.events} events
                          </span>
                        )}
                        {m.members === 0 && m.events === 0 && (
                          <span className={styles.detailsLink}>
                            View details &rarr;
                          </span>
                        )}
                      </div>
                      {m.dist && m.dist !== "N/A" && (
                        <span className={styles.distance}>{m.dist}</span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
          {hasMore && (
            <div
              ref={loadMoreRef}
              className={styles.loadMoreSentinel}
              aria-hidden="true"
            />
          )}
        </div>
      </section>
    </div>
  );
}
