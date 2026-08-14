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

interface CountryOption {
  id: string;
  name: string;
  code: string;
  alpha3?: string;
}

const ALL_COUNTRIES: CountryOption = { id: 'all', name: 'All', code: '' };

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
  const [countries, setCountries] = useState<CountryOption[]>([ALL_COUNTRIES]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<{ name: string; city?: string; country?: string; countryId?: string; avatar?: string; isGuest?: boolean; loginType?: string } | null>(null);

  useEffect(() => {
    fetch('/api/data/countries')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load countries');
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data)) setCountries([ALL_COUNTRIES, ...data]);
      })
      .catch(error => console.error('Countries API error:', error));
  }, []);

  useEffect(() => {
    async function loadUser(forceUserCountry = false) {
      const saved = localStorage.getItem('mcs_user');
      let user: { name: string; city?: string; country?: string; countryId?: string; avatar?: string; isGuest?: boolean; loginType?: string } | null = null;
      if (saved) {
        try { user = JSON.parse(saved); } catch { user = null; }
      }
      setCurrentUser(user);

      if (!user || user.isGuest) {
        setLocation({ city: 'All', country: 'All' });
        return;
      }

      let country = user.country || '';
      let countryId = user.countryId || '';
      try {
        const response = await fetch(`/api/data/profile?username=${encodeURIComponent(user.name)}`);
        const profiles = response.ok ? await response.json() : [];
        const profile = Array.isArray(profiles) ? profiles[0] : null;
        if (profile) {
          country = String(profile.country || '');
          countryId = String(profile.countryId || '');
          const updatedUser = {
            ...user,
            country,
            countryId,
            city: String(profile.city || user.city || ''),
            loginType: String(profile.loginTypeId || user.loginType || ''),
          };
          localStorage.setItem('mcs_user', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
        }
      } catch (error) {
        console.error('User country loading error:', error);
      }

      if (!countryId) {
        setLocation({ city: 'All', country: 'All' });
        return;
      }

      const hasSavedSelection = Boolean(localStorage.getItem('mcs_location'));
      if (forceUserCountry || !hasSavedSelection) {
        const selectedCountry = country || 'All';
        setLocation({ city: selectedCountry, country: selectedCountry, countryId });
      }
    }

    const handleAuthChange = () => { void loadUser(true); };
    void loadUser(false);
    window.addEventListener('mcs_auth_change', handleAuthChange);
    return () => window.removeEventListener('mcs_auth_change', handleAuthChange);
  }, [setLocation]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredCountries = countries.filter(country =>
    citySearch === ''
    || country.name.toLowerCase().includes(citySearch.toLowerCase())
    || country.code.toLowerCase().includes(citySearch.toLowerCase())
  );

  function handleCountrySelect(country: CountryOption) {
    setLocation({ city: country.name, country: country.name, region: country.code || undefined, countryId: country.id === 'all' ? '' : country.id });
    setLocationModalOpen(false);
    setCitySearch('');
    toast.add(`Country set to ${country.name}`, 'success');
    window.setTimeout(() => window.location.reload(), 50);
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
                    <div style={{ fontSize: 10, color: C.ink3, fontWeight: 600, marginTop: 1 }}>
                      {({ S: 'Student', J: 'NRI', E: 'Entrepreneur' } as Record<string, string>)[currentUser.loginType || ''] || ''} · {currentUser.city || location.city}
                    </div>
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
          label="Search country"
          value={citySearch}
          onChange={setCitySearch}
          placeholder="Boston, London, Pune…"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 420, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            {citySearch ? 'Results' : 'Countries'}
          </div>
          {filteredCountries.length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: C.ink3, fontSize: 13 }}>No countries found</div>
          )}
          {filteredCountries.map(country => (
            <button
              key={country.id}
              onClick={() => handleCountrySelect(country)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.line}`,
                background: location.country === country.name ? C.saffronLt : '#fff',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                transition: 'all 0.12s',
              }}
            >
              <Icon name="pin" size={16} color={location.country === country.name ? C.saffronDk : C.ink3}/>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: location.country === country.name ? C.saffronDk : C.ink }}>
                  {country.name}

                </div>
                <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500 }}>{country.code || (country.name === 'All' ? 'Show data from every country' : '')}</div>
              </div>
              {location.country === country.name && (
                <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.saffronDk }}>Current</div>
              )}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
