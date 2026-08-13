'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Tag, Avatar, ImgPh, SectionHead, PageHeader, Stat, useGlobalToast } from '@/components/primitives';
import Link from 'next/link';
import type { CurrentUser } from '@/data/profile';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

type Tab = 'overview' | 'edit' | 'preferences';
type LocationOption = { id: string; name: string };

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useGlobalToast();

  useEffect(() => {
    let username = '';
    const saved = localStorage.getItem('mcs_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        username = u.name;
      } catch {
        // ignore
      }
    }

    const url = `/api/data/profile${username ? `?username=${encodeURIComponent(username)}` : ''}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setMe(data[0]);
          try {
            const savedUser = localStorage.getItem('mcs_user');
            if (savedUser && data[0].country) {
              const user = JSON.parse(savedUser);
              if (!user.isGuest && user.country !== data[0].country) {
                localStorage.setItem('mcs_user', JSON.stringify({ ...user, country: data[0].country }));
                window.dispatchEvent(new Event('mcs_auth_change'));
              }
            }
          } catch {}
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !me) return <div style={{ padding: 40, color: C.ink3 }}>Loading profile...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Your Profile"
        marathi="माझी खाती"
        subtitle="Manage your personal information, saved Mandals, and preferences"
        actions={<>
          <Btn kind="ghost" size="md" iconL="share" onClick={() => {
            if (navigator.share) navigator.share({ title: 'My Profile', url: window.location.href });
            else { navigator.clipboard.writeText(window.location.href); toast.add('Profile link copied!', 'success'); }
          }}>Share profile</Btn>
          <Btn kind="dark" size="md" iconL="settings" onClick={() => setTab('edit')}>Account settings</Btn>
          <Btn kind="outline" size="md" onClick={async () => {
            if (auth.currentUser) {
              try {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await setDoc(userRef, { is_online: false, lastSeen: new Date() }, { merge: true });
                await signOut(auth);
              } catch (err) {
                console.error("Error setting offline status on sign out:", err);
              }
            }
            localStorage.removeItem('mcs_user');
            localStorage.removeItem('mcs_token');
            window.dispatchEvent(new Event('mcs_auth_change'));
            toast.add('Logged out successfully', 'success');
            router.push('/login');
          }}>Log out</Btn>
        </>}
      />

      {/* Cover */}
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <ImgPh kind="ornament" tone="saffron" height={140}/>
        <div className="mob-stack" style={{ padding: '0 28px 24px', display: 'grid', gridTemplateColumns: '128px 1fr auto', gap: 22, alignItems: 'flex-end' }}>
          <Avatar name={me.name} size={128} style={{ marginTop: -56, fontSize: 44, border: '5px solid #fff', boxShadow: '0 4px 16px rgba(15,14,12,0.1)' }}/>
          <div style={{ paddingTop: 18, minWidth: 0 }}>
            <h2 style={{
              margin: 0, fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink,
              letterSpacing: '-0.03em', display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap',
            }}>
              {me.name}
              <span style={{ fontFamily: F.deva, fontSize: 22, color: C.saffronDk, fontWeight: 400, letterSpacing: 0 }}>{me.marathi}</span>
              <Icon name="verify" size={20} color={C.green}/>
            </h2>
            <div style={{ marginTop: 4, fontSize: 14, color: C.ink2, fontWeight: 500 }}>{me.role}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: C.ink3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="pin" size={13} color={C.ink3}/> {me.city} · from {me.origin}</span>
              <span>·</span>
              <span><strong style={{ color: C.ink, fontWeight: 700 }}>{me.type}</strong> member of {me.mandal}</span>
              <span>·</span>
              <span>Joined {me.joined}</span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {me.open.map(o => <Tag key={o} color={C.green} bg={C.greenLt}>● Open to {o}</Tag>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 18 }}>
            <Btn kind="primary" size="md" iconL="user" onClick={() => setTab('edit')}>Edit profile</Btn>
            <Btn kind="outline" size="md" onClick={() => {
              if (navigator.share) navigator.share({ title: 'My Profile', url: window.location.href });
              else { navigator.clipboard.writeText(window.location.href); toast.add('Profile link copied!', 'success'); }
            }}><Icon name="share" size={16}/></Btn>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.line}`, padding: '0 4px' }}>
        {(['overview', 'edit', 'preferences'] as Tab[]).map(t => {
          const active = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} className={active ? undefined : 'nav-int'} style={{
              padding: '12px 18px', background: 'transparent', border: 'none',
              fontSize: 14, fontWeight: active ? 700 : 600,
              color: active ? C.saffronDk : C.ink2,
              borderBottom: `2px solid ${active ? C.saffron : 'transparent'}`,
              marginBottom: -1, cursor: 'pointer', textTransform: 'capitalize',
              fontFamily: F.ui, letterSpacing: '-0.005em',
            }}>{t}</button>
          );
        })}
      </div>

      {tab === 'overview' && <Overview me={me} />}
      {tab === 'edit' && <EditPanel me={me} onSaved={changes => setMe(current => current ? { ...current, ...changes } : current)} />}
      {tab === 'preferences' && <PreferencesPanel/>}
    </div>
  );
}

function Overview({ me }: { me: CurrentUser }) {
  // Activity metrics (connections, RSVPs, saved) depend on backend tables that
  // don't exist yet, so surface real profile facts instead of fabricated counts.
  const facts = [
    { v: me.mandal, l: 'Mandal' },
    { v: me.type, l: 'Membership' },
    { v: me.city, l: 'Based in' },
    { v: me.joined, l: 'Member since' },
  ];
  return (
    <>
      {/* Profile facts */}
      <div className="mob-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {facts.map((s, i) => (
          <Card key={i} pad={20}><Stat value={s.v} label={s.l}/></Card>
        ))}
      </div>

      <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginTop: 22 }}>
        {/* About + langs */}
        <Card pad={22}>
          <div style={{ fontSize: 11, color: C.ink3, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>About</div>
          <p style={{ margin: '8px 0 16px', fontSize: 14, color: C.ink2, fontWeight: 500, lineHeight: 1.6 }}>
            {me.bio}
          </p>

          <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
            <div>
              <div style={{ fontSize: 11, color: C.ink3, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Languages</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {me.langs.map((lang, i) => {
                  const isDeva = lang !== 'English';
                  return (
                    <Tag key={i}
                      color={isDeva ? C.brick : C.ink2}
                      bg={isDeva ? '#FAE0DA' : C.bgDeep}
                      style={isDeva ? { fontFamily: F.deva, textTransform: 'none', letterSpacing: 0, fontSize: 12 } : undefined}
                    >{lang}</Tag>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.ink3, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Contact</div>
              <div style={{ marginTop: 8, fontSize: 13, color: C.ink2, fontWeight: 500, lineHeight: 1.7 }}>
                <div>{me.email}</div>
                <div style={{ color: C.ink3 }}>{me.phone}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Saved Mandals */}
        <Card pad={0}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>Saved Mandals</div>
              <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 500, marginTop: 2 }}>Quick access while travelling</div>
            </div>
            <Link href="/mandals" style={{ textDecoration: 'none' }}>
              <Btn kind="ghost" size="sm">Browse all</Btn>
            </Link>
          </div>
          <div style={{ padding: '28px 18px', textAlign: 'center' }}>
            <Icon name="heart" size={22} color={C.ink4}/>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, marginTop: 8 }}>No saved Mandals yet</div>
            <p style={{ margin: '4px 0 14px', fontSize: 12, color: C.ink3, fontWeight: 500, lineHeight: 1.5 }}>
              Save Mandals for quick access while travelling.
            </p>
            <Link href="/mandals" style={{ textDecoration: 'none' }}>
              <Btn kind="outline" size="sm">Browse Mandals</Btn>
            </Link>
          </div>
        </Card>
      </div>

      {/* Events RSVPs */}
      <section style={{ marginTop: 22 }}>
        <SectionHead title="Your events" subtitle="Upcoming RSVPs"/>
        <Card pad={32} style={{ textAlign: 'center' }}>
          <Icon name="cal" size={24} color={C.ink4}/>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.ink, marginTop: 8 }}>No events yet</div>
          <p style={{ margin: '6px 0 16px', fontSize: 13, color: C.ink3, fontWeight: 500 }}>
            RSVP to community events and they&rsquo;ll show up here.
          </p>
          <Link href="/events" style={{ textDecoration: 'none' }}>
            <Btn kind="primary" size="md" iconL="cal">Explore events</Btn>
          </Link>
        </Card>
      </section>
    </>
  );
}

function EditPanel({ me, onSaved }: { me: CurrentUser; onSaved: (changes: Partial<CurrentUser>) => void }) {
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [countryId, setCountryId] = useState(me.countryId || '');
  const [cityId, setCityId] = useState(me.cityId || '');
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useGlobalToast();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/data/countries', { signal: controller.signal, cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load countries')))
      .then((records: LocationOption[]) => {
        const options = (Array.isArray(records) ? records : []).map(country => ({ ...country, id: String(country.id) }));
        const savedCountryId = String(me.countryId || '');
        const matchedCountryId = options.find(country => country.name.trim().toLowerCase() === me.country.trim().toLowerCase())?.id || '';
        setCountries(options);
        setCountryId(savedCountryId || matchedCountryId);
      })
      .catch(error => { if (!(error instanceof DOMException && error.name === 'AbortError')) console.error('Unable to load countries:', error); })
      .finally(() => setLocationsLoading(false));
    return () => controller.abort();
  }, [me.country, me.countryId]);

  useEffect(() => {
    if (!countryId) { setCities([]); return; }
    const controller = new AbortController();
    setCitiesLoading(true);
    fetch(`/api/v1/models/C_City?countryId=${encodeURIComponent(countryId)}`, { signal: controller.signal, cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load cities')))
      .then((payload: { records?: LocationOption[] }) => {
        const options = (Array.isArray(payload.records) ? payload.records : []).map(city => ({ ...city, id: String(city.id) }));
        const savedCityId = String(me.cityId || '');
        const matchedCityId = options.find(city => city.name.trim().toLowerCase() === me.city.trim().toLowerCase())?.id || '';
        setCities(options);
        setCityId(current => current || savedCityId || matchedCityId);
      })
      .catch(error => { if (!(error instanceof DOMException && error.name === 'AbortError')) { console.error('Unable to load cities:', error); setCities([]); } })
      .finally(() => setCitiesLoading(false));
    return () => controller.abort();
  }, [countryId, me.city, me.cityId]);
  async function saveLocation() {
    if (!countryId || !cityId) { toast.add('Please select country and city.', 'error'); return; }
    try {
      const savedUser = JSON.parse(localStorage.getItem('mcs_user') || '{}');
      const token = localStorage.getItem('mcs_token') || '';
      if (!savedUser.id || !token) throw new Error('Please sign in again.');
      setSaving(true);
      const response = await fetch(`/api/v1/models/ad_user/${encodeURIComponent(savedUser.id)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ C_Country_ID: Number(countryId), C_City_ID: Number(cityId) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not update location.');
      const country = countries.find(option => String(option.id) === countryId)?.name || '';
      const city = cities.find(option => String(option.id) === cityId)?.name || '';
      localStorage.setItem('mcs_user', JSON.stringify({ ...savedUser, country, countryId, city, cityId }));
      window.dispatchEvent(new Event('mcs_auth_change'));
      onSaved({ country, countryId, city, cityId });
      toast.add('Location updated successfully.', 'success');
    } catch (error) {
      toast.add(error instanceof Error ? error.message : 'Could not update location.', 'error');
    } finally { setSaving(false); }
  }

  return (
    <Card pad={28}>
      <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, maxWidth: 720 }}>
        <Field label="Display name" value={me.name}/>
        <Field label="Marathi name" value={me.marathi} deva/>
        <Field label="Email" value={me.email}/>
        <Field label="Phone" value={me.phone}/>
        <SelectField label="Country" value={countryId} disabled={locationsLoading} placeholder={locationsLoading ? 'Loading countries...' : 'Select country'} options={countries} onChange={value => { setCountryId(value); setCityId(''); }}/>
        <SelectField label="City" value={cityId} disabled={!countryId || citiesLoading} placeholder={citiesLoading ? 'Loading cities...' : countryId ? 'Select city' : 'Select country first'} options={cities} onChange={setCityId}/>
        <Field label="Origin" value={me.origin}/>
        <Field label="Mandal" value={me.mandal}/>
        <Field label="Member type" value={me.type}/>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Bio" multiline value={me.bio}/>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
        <Btn kind="primary" size="md" onClick={saveLocation} disabled={saving || !countryId || !cityId}>{saving ? 'Saving...' : 'Save changes'}</Btn>
        <Btn kind="ghost" size="md">Cancel</Btn>
      </div>
    </Card>
  );
}

function SelectField({ label, value, options, placeholder, disabled, onChange }: { label: string; value: string; options: LocationOption[]; placeholder: string; disabled?: boolean; onChange: (value: string) => void }) {
  return <label style={{ display: 'block' }}>
    <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
    <select value={value} disabled={disabled} onChange={event => onChange(event.target.value)} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 10, fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: 'inherit', background: disabled ? C.bgDeep : '#fff' }}>
      <option value="">{placeholder}</option>
      {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  </label>;
}

function Field({ label, value, multiline, deva }: { label: string; value: string; multiline?: boolean; deva?: boolean }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {multiline ? (
        <textarea defaultValue={value} rows={3} style={{
          width: '100%', padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 10,
          fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5,
        }}/>
      ) : (
        <input defaultValue={value} style={{
          width: '100%', padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 10,
          fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: deva ? F.deva : 'inherit',
        }}/>
      )}
    </label>
  );
}

function PreferencesPanel() {
  return (
    <Card pad={28}>
      <div style={{ maxWidth: 640 }}>
        <Group title="Language">
          <Toggle label="Show Marathi alongside English where available" on/>
          <Toggle label="Date format · DD/MM/YYYY (Indian)" on/>
        </Group>
        <Group title="Notifications">
          <Toggle label="New events near my city" on/>
          <Toggle label="Job matches in my field" on/>
          <Toggle label="Mandal community updates" on/>
          <Toggle label="Weekly digest email" on={false}/>
        </Group>
        <Group title="Privacy">
          <Toggle label="Show my profile to all members" on/>
          <Toggle label="Allow connection requests from anyone" on={false}/>
          <Toggle label="Show me on the global Mandal map" on/>
        </Group>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <Btn kind="primary" size="md">Save preferences</Btn>
      </div>
    </Card>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}

function Toggle({ label, on }: { label: string; on: boolean }) {
  const [v, setV] = useState(on);
  return (
    <button onClick={() => setV(!v)} className="btn-int" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px', background: '#fff', border: `1px solid ${C.line}`,
      borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
    }}>
      <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{label}</span>
      <span style={{
        width: 36, height: 20, borderRadius: 999,
        background: v ? C.saffron : '#D9D2C2', position: 'relative', flexShrink: 0,
        transition: 'background 0.18s ease',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: v ? 18 : 2,
          width: 16, height: 16, background: '#fff', borderRadius: '50%',
          transition: 'left 0.18s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}/>
      </span>
    </button>
  );
}
