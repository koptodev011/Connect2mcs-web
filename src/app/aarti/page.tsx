"use client"

import './aarti.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ChevronRight, Heart, ListFilter, Pause, Play, Repeat2, Search, Shuffle, SkipBack, SkipForward } from 'lucide-react'
import { PageHeader } from '@/components/primitives'
import { aartis, type Aarti, verses } from './data'
import AartiHome from './AartiHome'

const asset = '/assets/arti-list-logo.png'

function Listing({ items, initialFilter, open, favorites, toggleFavorite, back }: { items: Aarti[]; initialFilter: string; open: (a: Aarti) => void; favorites: Set<number>; toggleFavorite: (id: number) => void; back: () => void }) {
  const [filter, setFilter] = useState(initialFilter)
  const [query, setQuery] = useState('')
  const availableFilters = useMemo(() => ['All', 'Favorites', ...Array.from(new Set(items.map(item => item.deity).filter(Boolean)))], [items])
  const visible = useMemo(() => items.filter(a => {
    const category = filter === 'All' || (filter === 'Favorites' ? favorites.has(a.id) : a.deity === filter)
    return category && `${a.title} ${a.deity}`.toLowerCase().includes(query.toLowerCase())
  }), [filter, query, favorites, items])

  return <main className="page listing-page">
    <button className="back-link" onClick={back}><ArrowLeft /> Back to Aarti home</button>
    <PageHeader
      title="Aarti"
      marathi="आरती"
      subtitle="120+ devotional hymns curated by the community"
    />
    <div className="aarti-content">
      <div className="search-row"><label className="search-box"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by deity, aarti name..." /><button aria-label="Filters"><ListFilter /></button></label></div>
      <nav className="chips" aria-label="Aarti filters">{availableFilters.map(f => <button className={filter === f ? 'active' : ''} onClick={() => setFilter(f)} key={f}>{f}</button>)}</nav>
      <section className="aarti-list">{visible.map(a => <article className="aarti-card" key={a.id} onClick={() => open(a)}>
        <img src={a.image || asset} alt="Aarti lamp" />
        <div className="aarti-copy"><h2>{a.title}</h2><p>{a.deity} · {a.duration}</p></div>
        {a.popular && <span className="popular">Popular</span>}
        <button className="card-favorite" aria-label="Toggle favorite" onClick={e => { e.stopPropagation(); toggleFavorite(a.id) }}><Heart className={favorites.has(a.id) ? 'filled' : ''} /></button>
        <ChevronRight className="chevron" />
      </article>)}</section>
    </div>
  </main>
}

const DEFAULT_YOUTUBE_URL = 'https://www.youtube.com/results?search_query=sukhakarta+dukhaharta+aarti'
const DEFAULT_YOUTUBE_IDS = ['0Z2iw54kSHE', 'w6P94EUw7Uo', '0Z2iw54kSHE']

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || ''
    if (parsed.pathname.startsWith('/shorts/') || parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] || ''
    return parsed.searchParams.get('v') || ''
  } catch { return '' }
}

function YouTubeCard({ aarti }: { aarti: Aarti }) {
  const suppliedUrl = aarti.youtubeUrl?.trim()
  const videoId = suppliedUrl ? getYouTubeId(suppliedUrl) : ''
  const featuredUrl = suppliedUrl || DEFAULT_YOUTUBE_URL
  const featuredId = videoId || DEFAULT_YOUTUBE_IDS[0]
  return <section className="youtube-card"><div className="youtube-title"><strong><i>▶</i> YouTube</strong><a href={featuredUrl} target="_blank" rel="noreferrer">See all ›</a></div><a className="featured-video" href={featuredUrl} target="_blank" rel="noreferrer"><img src={`https://img.youtube.com/vi/${featuredId}/hqdefault.jpg`} alt={`${aarti.title} video`} /><Play /><div><b>{suppliedUrl ? aarti.title : 'Sukhakarta Dukhaharta Aarti | सुखकर्ता दुखहर्ता'}</b><small>{suppliedUrl ? `${aarti.deity} Aarti` : 'Ganpati Aarti with Lyrics'}</small></div></a>{!suppliedUrl && <div className="video-strip">{DEFAULT_YOUTUBE_IDS.map((id, i) => <a key={i} href={`https://youtu.be/${id}`} target="_blank" rel="noreferrer"><img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="Aarti video thumbnail" /><b>{i === 1 ? 'Ganpati Aarti Full - Slow Version' : 'Sukhakarta Aarti - Morning Prayer'}</b><small>{i === 1 ? '980K views' : '1.8M views'}</small></a>)}</div>}</section>
}

function Detail({ aarti, back, isFavorite, toggleFavorite }: { aarti: Aarti; back: () => void; isFavorite: boolean; toggleFavorite: () => void }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const lyricVerses = aarti.lyrics?.trim() ? aarti.lyrics.split(/\n\s*\n/) : verses
  const togglePlayback = async () => {
    if (!audioRef.current) return
    if (playing) audioRef.current.pause(); else await audioRef.current.play()
    setPlaying(!playing)
  }
  const [showAll, setShowAll] = useState(false)
  const [largeText, setLargeText] = useState(false)
  return <main className="page detail-page">
    <button className="back-link" onClick={back}><ArrowLeft /> Back to Aarti collection</button>
    <PageHeader title={aarti.title} marathi="आरती" subtitle={`${aarti.deity} · ${aarti.duration}`} />
    <div className="aarti-content detail-content">
      <section className="hero"><div><span>Aarti · {aarti.deity}</span><h2>{aarti.title}</h2><p>{aarti.deity} · {aarti.duration}</p></div><div className="ganesh-mark">ॐ</div></section>
      <audio ref={audioRef} src={aarti.audio || "/assets/dummy-aarti.wav"} onEnded={() => setPlaying(false)} /><div className="primary-actions"><button className="play-button" onClick={togglePlayback}>{playing ? <Pause /> : <Play />}{playing ? 'Pause Audio' : 'Play Audio'}</button><button className={isFavorite ? 'favorite active' : 'favorite'} onClick={toggleFavorite}><Heart className={isFavorite ? 'filled' : ''} />Favorite</button></div>
      <section className="player-card"><div className="times"><span>0:00</span><span>{aarti.duration}</span></div><div className="progress"><i style={{ width: playing ? '38%' : '9%' }} /><b style={{ left: playing ? '38%' : '9%' }} /></div><div className="player-controls"><button><Repeat2 /></button><button><SkipBack /></button><button className="main-play" onClick={togglePlayback}>{playing ? <Pause /> : <Play />}</button><button><SkipForward /></button><button><Shuffle /></button></div></section>
      <section className="lyrics-card"><div className="section-heading"><h3>Lyrics</h3><div><button onClick={() => setLargeText(false)}>A−</button><button onClick={() => setLargeText(true)}>A+</button></div></div><div className={largeText ? 'verses large' : 'verses'}>{lyricVerses.slice(0, showAll ? lyricVerses.length : 2).map((v, i) => <div className="verse" key={i}><p>{v}</p>{i === 0 && <span>धृपद</span>}</div>)}</div><footer><span>Showing {showAll ? lyricVerses.length : Math.min(2, lyricVerses.length)} of {lyricVerses.length} verses</span><button onClick={() => setShowAll(v => !v)}>{showAll ? 'Show less' : 'Show all'}</button></footer></section>
      <YouTubeCard aarti={aarti} />
    </div>
  </main>
}

export default function AartiPage() {
  const [screen, setScreen] = useState<'home' | 'listing'>('home')
  const [listingFilter, setListingFilter] = useState<string>('All')
  const [items, setItems] = useState<Aarti[]>([])
  const [categories, setCategories] = useState([{ id: 1, name: 'Ganpati', marathi: 'गणपती' }, { id: 2, name: 'Shankar', marathi: 'शंकर' }, { id: 3, name: 'Vitthal', marathi: 'विठ्ठल' }, { id: 4, name: 'Devi', marathi: 'देवी' }])
  const [apiLoaded, setApiLoaded] = useState(false)
  const [loadingArtis, setLoadingArtis] = useState(true)
  const [selected, setSelected] = useState<Aarti | null>(null)
  const [favorites, setFavorites] = useState(new Set<number>())
  const [favoriteIds, setFavoriteIds] = useState(new Map<number, number>())
  const getUserId = () => { try { return Number(JSON.parse(localStorage.getItem('mcs_user') || '{}').id) || 0 } catch { return 0 } }
  useEffect(() => {
    fetch('/api/v1/models/MCS_Aarati').then(r => r.ok ? r.json() : Promise.reject()).then((payload: Aarti[] | { records?: Array<Record<string, unknown>> }) => {
      const source = Array.isArray(payload) ? payload : payload.records || []
      const records: Aarti[] = source.filter(record => (record as Record<string, unknown>).IsActive !== false).map(record => {
        if ('title' in record) return record as Aarti
        const raw = record as Record<string, unknown> & { AD_Image_ID?: { id?: number }; MCS_Aarati_Category_ID?: { identifier?: string }; MCS_Duration?: string; MCS_IsPopular?: boolean; MCS_AudioURL?: string; AudioURL?: string; Name?: string; Value?: string; Help?: string; WeekDay?: { identifier?: string }; MCS_YouTubeURL?: string; id?: number }
        const image = raw.AD_Image_ID
        return { id: Number(raw.id), title: String(raw.Name || raw.Value || 'Aarti'), deity: String(raw.MCS_Aarati_Category_ID?.identifier || 'Deity'), duration: String(raw.MCS_Duration || '2:00'), popular: raw.MCS_IsPopular === true, lyrics: String(raw.Help || ''), image: image?.id ? `/api/image/${image.id}` : '/assets/arti-list-logo.png', audio: String(raw.MCS_AudioURL || raw.AudioURL || '/assets/dummy-aarti.wav'), weekday: String(raw.WeekDay?.identifier || ''), youtubeUrl: String(raw.MCS_YouTubeURL || '') }
      })
      if (records.length) { setItems(records); setApiLoaded(true); setSelected(current => current ? records.find(record => record.title === current.title) || current : null) }
    }).catch(() => setItems(aartis)).finally(() => setLoadingArtis(false))
    fetch('/api/v1/models/MCS_Aarati_Category').then(r => r.ok ? r.json() : Promise.reject()).then(payload => { const source = Array.isArray(payload) ? payload : payload.records || []; if (source.length) setCategories(source.filter((r: Record<string, unknown>) => r.IsActive !== false).map((r: Record<string, unknown>) => ({ id: Number(r.id), name: String(r.Name || r.Value || 'Category'), marathi: String(r.MCS_DevanagariName || r.Name || r.Value || 'Category') }))) }).catch(() => undefined)
    const userId = getUserId()
    if (userId) fetch(`/api/aarti/favorites?userId=${userId}`).then(r => r.json()).then(data => { const records = (data.favorites || []) as Array<{ id: number; aartiId: number }>; setFavorites(new Set(records.map(f => f.aartiId))); setFavoriteIds(new Map(records.map(f => [f.aartiId, f.id]))) }).catch(() => undefined)
  }, [])
  const toggleFavorite = async (id: number) => {
    const userId = getUserId()
    if (!userId) return
    if (!apiLoaded || !items.some(item => item.id === id)) return
    const targetId = id
    const active = !favorites.has(targetId)
    setFavorites(old => { const next = new Set(old); next.delete(id); if (active) next.add(targetId); else next.delete(targetId); return next })
    const response = await fetch('/api/aarti/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, aartiId: targetId, favoriteId: favoriteIds.get(targetId), active }) })
    if (response.ok) { const result = await response.json(); if (result.favoriteId) setFavoriteIds(old => new Map(old).set(targetId, Number(result.favoriteId))) }
    if (!response.ok) setFavorites(old => { const next = new Set(old); if (active) next.delete(targetId); else next.add(targetId); return next })
  }
  return <div className="app-shell">{selected ? <Detail aarti={selected} back={() => setSelected(null)} isFavorite={favorites.has(selected.id)} toggleFavorite={() => toggleFavorite(selected.id)} /> : screen === 'listing' ? <Listing items={items} initialFilter={listingFilter} open={setSelected} favorites={favorites} toggleFavorite={toggleFavorite} back={() => setScreen('home')} /> : <AartiHome items={items} categories={categories} loading={loadingArtis} favorites={favorites} open={setSelected} viewAll={() => { setListingFilter('All'); setScreen('listing') }} viewFavorites={() => { setListingFilter('Favorites'); setScreen('listing') }} viewDeity={(deity) => { setListingFilter(deity); setScreen('listing') }} />}</div>
}
