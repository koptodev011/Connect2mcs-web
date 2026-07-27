'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from './Icon';
import { Avatar, Modal, Field } from './primitives';
import { useMobileMenu } from './MobileMenuContext';
import { useLocation } from './LocationContext';
import { useGlobalToast } from './primitives';

const POPULAR_CITIES = [
  { city: 'Boston', country: 'USA', region: 'MA' },
  { city: 'New York', country: 'USA', region: 'NY' },
  { city: 'San Francisco', country: 'USA', region: 'CA' },
  { city: 'Edison', country: 'USA', region: 'NJ' },
  { city: 'Chicago', country: 'USA', region: 'IL' },
  { city: 'London', country: 'UK', region: '' },
  { city: 'Toronto', country: 'Canada', region: 'ON' },
  { city: 'Sydney', country: 'Australia', region: 'NSW' },
  { city: 'Dubai', country: 'UAE', region: '' },
  { city: 'Singapore', country: 'Singapore', region: '' },
  { city: 'Pune', country: 'India', region: 'MH' },
  { city: 'Mumbai', country: 'India', region: 'MH' },
];

const NOTIFICATIONS = [
  { id: '1', icon: 'cal', color: C.saffron, bg: C.saffronLt, title: 'Marathi Food Festival is in 6 days', sub: 'Edison, NJ · 412 going', time: '2h ago', read: false },
  { id: '2', icon: 'chat', color: C.blue, bg: '#DCE5F4', title: 'Rahul Deshmukh sent you a message', sub: '"Hi, are you attending the event..."', time: '4h ago', read: false },
  { id: '3', icon: 'work', color: C.green, bg: C.greenLt, title: 'New job match: Senior Designer at Infosys', sub: 'Boston, MA · $120K–$160K', time: '1d ago', read: false },
  { id: '4', icon: 'people', color: C.brick, bg: '#FAE0DA', title: 'Priya Joshi accepted your connection', sub: 'Maharashtra Mandal London', time: '2d ago', read: true },
  { id: '5', icon: 'verify', color: C.green, bg: C.greenLt, title: 'Your job application was viewed', sub: 'Wipro Technologies · Product Manager', time: '3d ago', read: true },
];

const SEARCH_SUGGESTIONS = [
  { label: 'Maharashtra Mandal Boston', href: '/mandals' },
  { label: 'Marathi Food Festival', href: '/events' },
  { label: 'Senior Engineer jobs', href: '/jobs' },
  { label: 'Pune Tiffin Service', href: '/tiffin' },
  { label: 'Gudhi Padwa events', href: '/events' },
];

export default function Header() {
  const { setIsOpen } = useMobileMenu();
  const { location, setLocation } = useLocation();
  const router = useRouter();
  const toast = useGlobalToast();

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<{ name: string; city?: string; avatar?: string } | null>(null);

  useEffect(() => {
    function loadUser() {
      const saved = localStorage.getItem('mcs_user');
      if (saved) {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    }

    loadUser();
    window.addEventListener('mcs_auth_change', loadUser);
    return () => window.removeEventListener('mcs_auth_change', loadUser);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredCities = POPULAR_CITIES.filter(c =>
    citySearch === '' || c.city.toLowerCase().includes(citySearch.toLowerCase()) || c.country.toLowerCase().includes(citySearch.toLowerCase())
  );

  function handleCitySelect(c: typeof POPULAR_CITIES[0]) {
    setLocation(c);
    setLocationModalOpen(false);
    setCitySearch('');
    toast.add(`Location set to ${c.city}`, 'success');
  }

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSearchSuggestions(false);
      const q = searchQuery.toLowerCase();
      if (q.includes('mandal') || q.includes('community')) router.push(`/mandals`);
      else if (q.includes('event') || q.includes('festival')) router.push(`/events`);
      else if (q.includes('job') || q.includes('career')) router.push(`/jobs`);
      else if (q.includes('tiffin') || q.includes('food')) router.push(`/tiffin`);
      else if (q.includes('hous') || q.includes('room')) router.push(`/housing`);
      else router.push(`/mandals`);
      setSearchQuery('');
    }
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  // Close notifications on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      <header style={{
        background: C.surface,
        borderBottom: `1px solid ${C.line}`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 72,
        flexShrink: 0,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Header Utilities */}
        <div className="mob-pad-x" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '0 32px',
          width: '100%',
        }}>
          {/* Mobile menu toggle */}
          <button
            className="desktop-hide-flex"
            onClick={() => setIsOpen(true)}
            style={{
              padding: 8, background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: -8
            }}
            aria-label="Open menu"
          >
            <Icon name="list" size={24} color={C.ink}/>
          </button>

          {/* Left side */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>

            {/* Mobile Logo */}
            <Link href="/" className="desktop-hide-flex" style={{ alignItems: 'center', gap: 8, textDecoration: 'none', marginLeft: 4 }}>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: C.ink, letterSpacing: '-0.025em' }}>Connect2MCS</div>
            </Link>

            {/* Location Picker — desktop only */}
            <button
              className="mob-hide"
              onClick={() => setLocationModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                padding: '8px 12px', background: C.bgDeep, border: `1px solid ${C.line}`,
                borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: F.ui,
                transition: 'border-color 0.15s',
              }}
            >
              <Icon name="pin" size={16} color={C.saffron}/>
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.ink3, letterSpacing: '0.04em' }}>YOU&rsquo;RE IN</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 1 }}>
                  {location.city}{location.region ? `, ${location.region}` : ''} <span style={{ color: C.ink3, fontWeight: 500 }}>· change</span>
                </div>
              </div>
              <span style={{ display: 'flex', transform: 'rotate(90deg)' }}>
                <Icon name="chev" size={14} color={C.ink3}/>
              </span>
            </button>
          </div>

          {/* Search — desktop only */}
          <div className="mob-hide" style={{ position: 'relative', flex: 1, maxWidth: 600 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', background: C.bgDeep, borderRadius: 10,
              border: `1px solid ${showSearchSuggestions ? C.saffron : C.line}`,
              transition: 'border-color 0.15s',
            }}>
              <Icon name="search" size={18} color={C.ink3}/>
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSearchSuggestions(e.target.value.length > 0); }}
                onFocus={() => setShowSearchSuggestions(searchQuery.length > 0 || true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 150)}
                onKeyDown={handleSearch}
                placeholder="Search mandals, events, jobs, gudhi padwa…"
                style={{
                  flex: 1, border: 'none', background: 'transparent', outline: 'none',
                  fontSize: 14, color: C.ink, fontWeight: 500, fontFamily: F.ui,
                }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowSearchSuggestions(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <Icon name="plus" size={16} color={C.ink3}/>
                </button>
              )}
            </div>

            {/* Search suggestions dropdown */}
            {showSearchSuggestions && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
                background: '#fff', borderRadius: 12, border: `1px solid ${C.line}`,
                boxShadow: '0 8px 24px rgba(15,14,12,0.1)', zIndex: 200, overflow: 'hidden',
              }}>
                <div style={{ padding: '10px 16px 6px', fontSize: 10.5, fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {searchQuery ? 'Suggestions' : 'Popular searches'}
                </div>
                {(searchQuery
                  ? SEARCH_SUGGESTIONS.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  : SEARCH_SUGGESTIONS
                ).map((s, i) => (
                  <Link key={i} href={s.href} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', cursor: 'pointer',
                        borderTop: `1px solid ${C.line}`,
                        color: C.ink, fontSize: 13.5, fontWeight: 500,
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.bgDeep)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Icon name="search" size={14} color={C.ink3}/>
                      {s.label}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Link href="/chat" aria-label="Open chat" style={{ textDecoration: 'none' }}>
              <button style={{
                width: 40, height: 40, borderRadius: 10, background: C.bgDeep,
                border: `1px solid ${C.line}`, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <Icon name="chat" size={18} color={C.ink2}/>
                <span style={{
                  position: 'absolute', top: 6, right: 6, minWidth: 14, height: 14, padding: '0 4px',
                  background: C.saffron, color: '#fff', borderRadius: 999, fontSize: 9, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${C.bgDeep}`,
                }}>3</span>
              </button>
            </Link>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                aria-label="Notifications"
                onClick={() => setNotifOpen(v => !v)}
                style={{
                  width: 40, height: 40, borderRadius: 10, background: notifOpen ? C.saffronLt : C.bgDeep,
                  border: `1px solid ${notifOpen ? C.saffron : C.line}`, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', transition: 'all 0.15s',
                }}
              >
                <Icon name="bell" size={18} color={notifOpen ? C.saffronDk : C.ink2}/>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 7, right: 7, width: 8, height: 8,
                    background: C.brick, borderRadius: '50%', border: `2px solid ${C.bgDeep}`,
                  }}/>
                )}
              </button>

              {/* Notifications dropdown */}
              {notifOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  width: 360, background: '#fff', borderRadius: 16,
                  border: `1px solid ${C.line}`, boxShadow: '0 12px 32px rgba(15,14,12,0.12)',
                  zIndex: 200, overflow: 'hidden',
                }}>
                  <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: C.ink }}>Notifications</div>
                      {unreadCount > 0 && <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, marginTop: 1 }}>{unreadCount} unread</div>}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ fontSize: 12, color: C.saffronDk, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                        style={{
                          display: 'flex', gap: 12, padding: '14px 18px',
                          borderBottom: `1px solid ${C.line}`,
                          background: n.read ? 'transparent' : 'rgba(226,106,31,0.03)',
                          cursor: 'pointer', transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = C.bgDeep)}
                        onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(226,106,31,0.03)')}
                      >
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: n.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon name={n.icon as Parameters<typeof Icon>[0]['name']} size={18} color={n.color}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: C.ink, lineHeight: 1.35 }}>{n.title}</div>
                          <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, marginTop: 2 }}>{n.sub}</div>
                          <div style={{ fontSize: 11, color: C.ink4, fontWeight: 500, marginTop: 4 }}>{n.time}</div>
                        </div>
                        {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.saffron, flexShrink: 0, marginTop: 5 }}/>}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '12px 18px', textAlign: 'center' }}>
                    <Link href="/notifications" onClick={() => setNotifOpen(false)} style={{ fontSize: 13, color: C.saffronDk, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'block' }}>
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {currentUser ? (
              <Link href="/profile" style={{ textDecoration: 'none' }}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '5px 14px 5px 5px',
                  background: C.bgDeep, border: `1px solid ${C.line}`, borderRadius: 999,
                  cursor: 'pointer', fontFamily: F.ui,
                }}>
                  <Avatar name={currentUser.name} size={32}/>
                  <div className="mob-hide" style={{ textAlign: 'left', lineHeight: 1.1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{currentUser.name.split(' ')[0]}</div>
                    <div style={{ fontSize: 10, color: C.ink3, fontWeight: 600, marginTop: 1 }}>NRI · {currentUser.city || location.city}</div>
                  </div>
                  <span style={{ display: 'flex', transform: 'rotate(90deg)' }}>
                    <Icon name="chev" size={14} color={C.ink3}/>
                  </span>
                </button>
              </Link>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '5px 14px 5px 5px',
                  background: C.bgDeep, border: `1px solid ${C.line}`, borderRadius: 999,
                  cursor: 'pointer', fontFamily: F.ui,
                }}>
                  <Avatar name="Guest" size={32}/>
                  <div className="mob-hide" style={{ textAlign: 'left', lineHeight: 1.1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Guest</div>
                    <div style={{ fontSize: 10, color: C.ink3, fontWeight: 600, marginTop: 1 }}>Sign in</div>
                  </div>
                  <span style={{ display: 'flex', transform: 'rotate(90deg)' }}>
                    <Icon name="chev" size={14} color={C.ink3}/>
                  </span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Location Picker Modal */}
      <Modal isOpen={locationModalOpen} onClose={() => { setLocationModalOpen(false); setCitySearch(''); }} title="Change your location" marathi="स्थान बदला" width={440}>
        <Field
          label="Search city"
          value={citySearch}
          onChange={setCitySearch}
          placeholder="Boston, London, Pune…"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            {citySearch ? 'Results' : 'Popular cities'}
          </div>
          {filteredCities.length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: C.ink3, fontSize: 13 }}>No cities found</div>
          )}
          {filteredCities.map((c, i) => (
            <button
              key={i}
              onClick={() => handleCitySelect(c)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.line}`,
                background: location.city === c.city ? C.saffronLt : '#fff',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                transition: 'all 0.12s',
              }}
            >
              <Icon name="pin" size={16} color={location.city === c.city ? C.saffronDk : C.ink3}/>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: location.city === c.city ? C.saffronDk : C.ink }}>
                  {c.city}{c.region ? `, ${c.region}` : ''}
                </div>
                <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>{c.country}</div>
              </div>
              {location.city === c.city && (
                <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.saffronDk }}>Current</div>
              )}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
