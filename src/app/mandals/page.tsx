"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { C, F } from "@/lib/tokens";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import {
  Btn,
  Card,
  Pill,
  ImgPh,
  SectionHead,
  Rating,
  PageHeader,
  Tag,
  useGlobalToast,
} from "@/components/primitives";
import { Mandal } from "@/data/mandals";
import heroImage from "../../../public/images/mandals/worldwide-hero.png";
import styles from "./page.module.css";
import MandalMap from '@/components/MandalMap';

const filters = ['All', 'Near me', 'India', 'North America', 'Europe', 'Middle East', 'Asia-Pacific', 'Africa'];

const PAGE_SIZE = 12;

export default function MandalsPage() {
  const [mandalsData, setMandalsData] = useState<Mandal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const toast = useGlobalToast();
  const [active, setActive] = useState('All');
  const [activeRegion, setActiveRegion] = useState('All');
  const [mapView, setMapView] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

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

   const featuredMandal = mandalsData.find(m => m.code === 'TX') || mandalsData[0] || null;
  const countryCount = new Set(mandalsData.map(m => m.country).filter(Boolean)).size;

  return (
    <main className={styles.page}>
      {/* <section className={styles.hero}>
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
      </section> */}

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

       {/* <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {filters.map(f => <Pill key={f} active={active === f} onClick={() => { setActive(f); setVisibleCount(PAGE_SIZE); }}>{f}</Pill>)}
      </div> */}

      {/* Map + featured */}
      <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Global map view</div>
              <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 2 }}>
                {loading ? 'Loading map...' : `${mandalsData.length} Mandals plotted worldwide`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, background: C.bgDeep, padding: 3, borderRadius: 8 }}>
              <button onClick={() => setMapView(true)} style={{ padding: '6px 12px', background: mapView ? '#fff' : 'transparent', color: mapView ? C.ink : C.ink3, border: 'none', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
                <Icon name="map" size={14}/> Map
              </button>
              <button onClick={() => setMapView(false)} style={{ padding: '6px 12px', background: !mapView ? '#fff' : 'transparent', color: !mapView ? C.ink : C.ink3, border: 'none', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
                <Icon name="list" size={14}/> List
              </button>
            </div>
          </div>
          {mapView ? (
          <div style={{ position: 'relative', height: 380, background: '#fff', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, transform: `scale(${mapZoom})`, transformOrigin: 'center', transition: 'transform 0.2s' }}>
              <MandalMap mandals={mandalsData} />
            </div>
            <div style={{ position: 'absolute', bottom: 14, left: 14, background: '#fff', padding: '10px 14px', borderRadius: 12, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 14, fontSize: 11.5, fontWeight: 600, boxShadow: '0 2px 8px rgba(15,14,12,0.06)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: C.saffron, borderRadius: '50%' }}/>{loading ? '...' : mandalsData.length} Mandals</span>
              <span style={{ width: 1, height: 14, background: C.line }}/>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: C.brick, borderRadius: '50%' }}/>12 hosting now</span>
            </div>
            <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => setMapZoom(z => Math.min(z + 0.2, 2))} style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', border: `1px solid ${C.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: C.ink2, fontFamily: F.display }}>+</button>
              <button onClick={() => setMapZoom(z => Math.max(z - 0.2, 0.5))} style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', border: `1px solid ${C.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: C.ink2, fontFamily: F.display }}>−</button>
            </div>
          </div>
          ) : (
            <div style={{ height: 380, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mandalsData.slice(0,8).map((m, i) => (
                <Link key={i} href={`/mandals/${m.code}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${C.line}` }}>
                  <Icon name="map" size={16} color={C.saffron}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                    <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>{m.city}, {m.country}</div>
                  </div>
                  {m.rating > 0 && <div style={{ marginLeft: 'auto', flexShrink: 0 }}><Rating value={m.rating} /></div>}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card pad={0} style={{ overflow: 'hidden' }}>
          {!featuredMandal ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.ink3 }}>Loading featured mandal...</div>
          ) : (
            <>
              <ImgPh kind="mandal" height={160} tone={featuredMandal.tone} badge="Featured Mandal" src={featuredMandal.image}/>
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontFamily: F.display, fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: C.ink, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{featuredMandal.name}</h3>
                    <div style={{ fontSize: 12, color: C.ink3, marginTop: 4, fontWeight: 500 }}>{featuredMandal.city}, {featuredMandal.country} · Est. {featuredMandal.est}</div>
                  </div>
                  {featuredMandal.rating > 0 && <Rating value={featuredMandal.rating} size="lg"/>}
                </div>
                <p style={{ margin: '10px 0 12px', fontSize: 12.5, color: C.ink2, fontWeight: 500, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {featuredMandal.about || `A vibrant Marathi cultural body helping community members connect in ${featuredMandal.city}.`}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '10px 0', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                  {[
                    [featuredMandal.members.toLocaleString(), 'Members'],
                    [featuredMandal.events.toString(), 'Events/yr'],
                    [(new Date().getFullYear() - featuredMandal.est).toString(), 'Years old']
                  ].map(([n, l], i) => (
                    <div key={i} style={{ textAlign: 'center', borderRight: i < 2 ? `1px dashed ${C.line}` : 'none' }}>
                      <div className="num" style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.ink }}>{n}</div>
                      <div style={{ fontSize: 9.5, color: C.ink3, fontWeight: 600, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <Link href={`/mandals/${featuredMandal.code}`} style={{ flex: 1, textDecoration: 'none' }}>
                    <Btn kind="primary" size="md" full>Visit page</Btn>
                  </Link>
                  
                  <Btn kind="outline" size="md" onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + '/mandals/' + featuredMandal.code);
                    toast.add('Link copied to clipboard!', 'success');
                  }}><Icon name="share" size={16}/></Btn>
                </div>
              </div>
            </>
          )}
        </Card>
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
