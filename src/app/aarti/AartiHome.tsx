"use client"

import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Landmark, ListFilter, Play, Search } from 'lucide-react'
import { PageHeader } from '@/components/primitives'
import type { Aarti } from './data'
import './aarti.css'



function Heading({ children, viewAll }: { children: React.ReactNode; viewAll?: () => void }) {
  return <div className="home-section-title"><h2>{children}</h2>{viewAll && <button onClick={viewAll}>View all <ChevronRight/></button>}</div>
}

export default function AartiHome({ items, categories, loading, favorites, open, viewAll, viewFavorites, viewDeity }: { items: Aarti[]; categories: Array<{ id: number; name: string; marathi: string }>; loading: boolean; favorites: Set<number>; open: (a: Aarti) => void; viewAll: () => void; viewFavorites: () => void; viewDeity: (deity: string) => void }) {
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(8)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const filteredItems = items.filter(a => `${a.title} ${a.deity}`.toLowerCase().includes(query.toLowerCase()))
  const preview = filteredItems.slice(0, visibleCount)
  const hasMore = visibleCount < filteredItems.length

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasMore) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) setVisibleCount(count => Math.min(count + 8, filteredItems.length))
    }, { rootMargin: '160px 0px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, filteredItems.length])
  const favoriteItems = items.filter(a => favorites.has(a.id)).slice(0, 3)
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())
  const dailyAarti = items.find(a => a.weekday?.toLowerCase() === today.toLowerCase()) || items[0]
  return <main className="page aarti-home-page">
    <PageHeader title="Aarti" marathi="आरती" subtitle="120+ devotional hymns curated by the community"/>
    <section className="home-hero" onClick={() => dailyAarti && open(dailyAarti)}>
      <div className="home-hero-copy"><span>✦ Aarti of the day · {today}</span><h2>{dailyAarti?.title || 'Aarti'}</h2><p>{dailyAarti ? `${dailyAarti.deity} · ${dailyAarti.duration}` : 'Loading...'}</p><button><Play/> Play now</button></div>
    </section>
    <label className="search-box home-search"><Search/><input value={query} onChange={e => { setQuery(e.target.value); setVisibleCount(8) }} placeholder="Search aarti hymns..."/><button aria-label="Filters"><ListFilter/></button></label>
    <section className="home-section"><Heading>Browse by Deity</Heading><div className="deity-grid">{categories.map(category => <button className="deity-card" key={category.id} onClick={() => viewDeity(category.name)}><span><Landmark/></span><b>{category.marathi}</b><small>{category.name}</small></button>)}</div></section>
    <section className="home-section"><Heading viewAll={viewFavorites}>My Favorites</Heading>{favoriteItems.length ? <div className="favorites-grid">{favoriteItems.map(a => <button className="favorite-collection" key={a.id} onClick={() => open(a)}><span className="collection-art orange" style={{backgroundImage: `url(${a.image || '/assets/arti-background.png'})`, backgroundSize: 'cover'}}><em>Favorite</em></span><span className="collection-copy"><b>{a.title}</b><small>{a.deity} · {a.duration}</small></span></button>)}</div> : <p className="empty-state">Your favorite Aartis will appear here.</p>}</section>
    <section className="home-section"><Heading viewAll={viewAll}>All Aartis</Heading><div className="home-aarti-grid">{preview.map(a => <button className="home-aarti-card" key={a.id} onClick={() => open(a)}><img src={a.image || "/assets/arti-list-logo.png"} alt="Aarti lamp"/><span><b>{a.title}</b><small>{a.deity} · {a.duration}</small></span><i><Play/></i></button>)}</div>{loading ? <p className="empty-state">Loading Aartis...</p> : !filteredItems.length ? <p className="empty-state">No Aartis found</p> : hasMore && <div ref={loadMoreRef} className="aarti-load-more" aria-label="Loading more Aartis"><span/></div>}</section>
  </main>
}
