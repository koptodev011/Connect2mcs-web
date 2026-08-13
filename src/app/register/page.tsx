'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Card, useGlobalToast } from '@/components/primitives';
import { OrnamentDivider } from '@/components/Ornament';

type Step = 'personal' | 'role' | 'verify' | 'password';

type LocationOption = { id: string; name: string };

const steps: { key: Step; label: string; marathi: string }[] = [
  { key: 'personal', label: 'Personal', marathi: 'वैयक्तिक' },
  { key: 'role',     label: 'Role',     marathi: 'भूमिका' },
  { key: 'verify',   label: 'Verify',   marathi: 'पडताळा' },
  { key: 'password', label: 'Password', marathi: 'पासवर्ड' },
];

const residencyOptions = [
  { value: 'NRI', label: 'NRI / Living Abroad', icon: 'globe' as const },
  { value: 'Resident', label: 'Indian Resident', icon: 'map' as const },
];

const roleOptions = [
  { value: 'Student', label: 'Student', icon: 'grad' as const },
  { value: 'Entrepreneur', label: 'Entrepreneur', icon: 'work' as const },
  { value: 'NRI Member', label: 'NRI Member', icon: 'globe' as const },
];

const bizTypeOptions = [
  { value: 'Taxi Driver', label: 'Taxi Driver' },
  { value: 'Tiffin Services', label: 'Tiffin Services' },
  { value: 'Maid', label: 'Maid' },
  { value: 'Other', label: 'Other' },
];

export default function RegisterPage() {
  const router = useRouter();
  const toast = useGlobalToast();

  const [step, setStep] = useState<Step>('personal');
  const [loading, setLoading] = useState(false);
  const [errorShake, setErrorShake] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [residency, setResidency] = useState('');
  const [countryId, setCountryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [userType, setUserType] = useState('');
  const [entType, setEntType] = useState('');
  const [bizName, setBizName] = useState('');
  const [bizDesc, setBizDesc] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizWebsite, setBizWebsite] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/data/countries', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('Failed to load countries');
        return response.json();
      })
      .then(data => {
        if (active) setCountries(Array.isArray(data) ? data : []);
      })
      .catch(error => {
        console.error('Could not load registration countries:', error);
      })
      .finally(() => {
        if (active) setCountriesLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!countryId) return;

    let active = true;
    fetch(`/api/v1/models/C_City?countryId=${encodeURIComponent(countryId)}`, { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('Failed to load cities');
        return response.json();
      })
      .then(data => {
        if (active) setCities(Array.isArray(data.records) ? data.records : []);
      })
      .catch(error => {
        console.error('Could not load registration cities:', error);
      })
      .finally(() => {
        if (active) setCitiesLoading(false);
      });
    return () => { active = false; };
  }, [countryId]);

  const stepIndex = steps.findIndex(s => s.key === step);

  const triggerError = (msg: string) => {
    toast.add(msg, 'error');
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);
  };

  const goNext = () => {
    const i = stepIndex;
    if (i < steps.length - 1) setStep(steps[i + 1].key);
  };

  const goBack = () => {
    const i = stepIndex;
    if (i > 0) setStep(steps[i - 1].key);
  };

  const handlePersonalNext = () => {
    if (!firstName.trim()) { triggerError('Please enter your first name.'); return; }
    if (!phone.trim() || phone.trim().length < 10) { triggerError('Please enter a valid phone number.'); return; }
    if (!email.trim() || !email.includes('@')) { triggerError('Please enter a valid email address.'); return; }
    if (!residency) { triggerError('Please select your residency type.'); return; }
    if (!countryId) { triggerError('Please select your country.'); return; }
    if (!cityId) { triggerError('Please select your city.'); return; }
    goNext();
  };

  const handleSendOtp = async () => {
    if (!userType) { triggerError('Please select your role.'); return; }
    if (userType === 'Entrepreneur' && !entType) { triggerError('Please select your business type.'); return; }
    if (entType === 'Other' && !bizName.trim()) { triggerError('Please enter your business name.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: firstName.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.add('OTP sent to your email/phone!', 'success');
        goNext();
      } else {
        triggerError(data.error || 'Failed to send OTP.');
      }
    } catch {
      triggerError('Connection failed. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNext = () => {
    if (!otp.trim() || otp.trim().length < 4) { triggerError('Please enter a valid OTP.'); return; }
    goNext();
  };

  const handleComplete = async () => {
    if (!password.trim() || password.trim().length < 4) { triggerError('Password must be at least 4 characters.'); return; }
    if (password !== confirmPassword) { triggerError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        firstName: firstName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        otp: otp.trim(),
        password: password.trim(),
        userType,
        residencyType: residency,
        countryId,
        cityId,
      };
      if (userType === 'Entrepreneur') {
        body.entType = entType;
        if (entType === 'Other') {
          body.businessName = bizName.trim();
          body.businessDesc = bizDesc.trim();
          body.businessEmail = bizEmail.trim();
          body.businessPhone = bizPhone.trim();
          body.businessWebsite = bizWebsite.trim();
        }
      }
      const res = await fetch('/api/auth/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.add('Registration complete! You can now sign in.', 'success');
        router.push('/login');
      } else {
        triggerError(data.error || 'Registration failed.');
      }
    } catch {
      triggerError('Connection failed. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = () => ({
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: 14,
    fontWeight: 500,
    color: C.ink,
    fontFamily: F.ui,
  } as React.CSSProperties);

  const fieldContainer = (focused: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    background: focused ? '#fff' : C.bgDeep,
    border: `1px solid ${focused ? C.saffron : C.line}`,
    borderRadius: 12,
    boxShadow: focused ? '0 0 0 4px rgba(226,106,31,0.08)' : 'none',
    transition: 'all 0.2s',
  } as React.CSSProperties);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - 180px)', padding: '24px 16px',
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .shake-element { animation: shake 0.4s ease-in-out; }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />

      <Card
        style={{
          width: '100%', maxWidth: 480,
          background: '#fff', border: `1px solid ${C.line}`,
          boxShadow: '0 12px 40px rgba(15,14,12,0.06)',
          borderRadius: 20, transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        className={errorShake ? 'shake-element' : ''}
        pad={36}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 14,
            background: C.saffronLt, color: C.saffronDk, marginBottom: 16,
            boxShadow: '0 4px 12px rgba(226,106,31,0.1)',
          }}>
            <Icon name="user" size={24} color={C.saffronDk} />
          </div>
          <h2 style={{
            margin: '0 0 6px', fontFamily: F.display, fontSize: 26,
            fontWeight: 700, color: C.ink, letterSpacing: '-0.02em',
          }}>
            Create Account
          </h2>
          <div style={{
            fontSize: 13.5, color: C.ink3, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span>l</span>
            <span style={{ color: C.saffronDk, fontWeight: 700 }}>नोंदणी</span>
            <span>l</span>
            <span>Join the community</span>
          </div>
        </div>

        <OrnamentDivider align="center" />

        <div style={{ display: 'flex', gap: 8, marginTop: 24, marginBottom: 28 }}>
          {steps.map((s, i) => (
            <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12.5, fontWeight: 700, fontFamily: F.ui,
                background: i <= stepIndex ? C.saffron : C.line,
                color: i <= stepIndex ? '#fff' : C.ink3,
                transition: 'all 0.3s',
              }}>
                {i + 1}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.03em', color: i === stepIndex ? C.saffronDk : C.ink3,
              }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Step 1: Personal ── */}
        {step === 'personal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                First Name
              </label>
              <div style={fieldContainer(false)}>
                <Icon name="people" size={16} color={C.ink3} />
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g. Umesh" style={inputStyle()} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Phone Number
              </label>
              <div style={fieldContainer(false)}>
                <Icon name="book" size={16} color={C.ink3} />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+1 987 654 3210" style={inputStyle()} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Email
              </label>
              <div style={fieldContainer(false)}>
                <Icon name="book" size={16} color={C.ink3} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" style={inputStyle()} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Country
                </label>
                <div style={fieldContainer(false)}>
                  <Icon name="globe" size={16} color={C.ink3} />
                  <select
                    value={countryId}
                    onChange={event => {
                      setCountryId(event.target.value);
                      setCityId('');
                      setCities([]);
                      setCitiesLoading(Boolean(event.target.value));
                    }}
                    disabled={countriesLoading}
                    style={{
                      ...inputStyle(),
                      width: '100%', minWidth: 0, appearance: 'none',
                      color: countryId ? C.ink : C.ink3,
                      cursor: countriesLoading ? 'wait' : 'pointer',
                    }}
                  >
                    <option value="">{countriesLoading ? 'Loading...' : 'Select country'}</option>
                    {countries.map(country => <option key={country.id} value={country.id}>{country.name}</option>)}
                  </select>
                  <Icon name="chev" size={16} color={C.ink3} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  City
                </label>
                <div style={fieldContainer(false)}>
                  <Icon name="map" size={16} color={C.ink3} />
                  <select
                    value={cityId}
                    onChange={event => setCityId(event.target.value)}
                    disabled={!countryId || citiesLoading}
                    style={{
                      ...inputStyle(),
                      width: '100%', minWidth: 0, appearance: 'none',
                      color: cityId ? C.ink : C.ink3,
                      cursor: !countryId || citiesLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <option value="">
                      {citiesLoading ? 'Loading...' : countryId ? 'Select city' : 'Select country first'}
                    </option>
                    {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                  </select>
                  <Icon name="chev" size={16} color={!countryId ? C.line : C.ink3} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                I am joining as
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {residencyOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className="btn-int"
                    onClick={() => setResidency(opt.value)}
                    style={{
                      flex: 1, aspectRatio: '1 / 1', borderRadius: 12, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontFamily: F.ui, fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                      background: residency === opt.value ? C.saffronLt : C.bgDeep,
                      border: `1.5px solid ${residency === opt.value ? C.saffron : C.line}`,
                      color: residency === opt.value ? C.saffronDk : C.ink,
                    }}
                  >
                    <Icon name={opt.icon} size={24} color={residency === opt.value ? C.saffronDk : C.ink3} />
                    <span style={{ textAlign: 'center', lineHeight: 1.3 }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="btn-int" onClick={handlePersonalNext}
              style={{
                marginTop: 8, height: 48, borderRadius: 12, width: '100%',
                background: C.saffron, color: '#fff', border: `1px solid ${C.saffron}`,
                fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: F.ui,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(226,106,31,0.15)',
              }}
            >
              Next — Role
              <Icon name="chevR" size={16} color="#fff" style={{ marginLeft: 6 }} />
            </button>
          </div>
        )}

        {/* ── Step 2: Role ── */}
        {step === 'role' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 14, color: C.ink3, fontWeight: 500, textAlign: 'center' }}>
              What best describes you?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {roleOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className="btn-int"
                  onClick={() => { setUserType(opt.value); setEntType(''); }}
                  style={{
                    flex: 1, aspectRatio: '1 / 1', borderRadius: 12, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: F.ui, fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                    background: userType === opt.value ? C.saffronLt : C.bgDeep,
                    border: `1.5px solid ${userType === opt.value ? C.saffron : C.line}`,
                    color: userType === opt.value ? C.saffronDk : C.ink,
                  }}
                >
                  <Icon name={opt.icon} size={24} color={userType === opt.value ? C.saffronDk : C.ink3} />
                  {opt.label}
                </button>
              ))}
            </div>

            {userType === 'Entrepreneur' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Business Type
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bizTypeOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className="btn-int"
                        onClick={() => setEntType(opt.value)}
                        style={{
                          height: 44, borderRadius: 12, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: F.ui, fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                          background: entType === opt.value ? C.saffronLt : C.bgDeep,
                          border: `1.5px solid ${entType === opt.value ? C.saffron : C.line}`,
                          color: entType === opt.value ? C.saffronDk : C.ink,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {entType === 'Other' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Business Name
                      </label>
                      <div style={fieldContainer(false)}>
                        <Icon name="work" size={16} color={C.ink3} />
                        <input type="text" value={bizName} onChange={e => setBizName(e.target.value)}
                          placeholder="Your business name" style={inputStyle()} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Description
                      </label>
                      <div style={fieldContainer(false)}>
                        <Icon name="book" size={16} color={C.ink3} />
                        <input type="text" value={bizDesc} onChange={e => setBizDesc(e.target.value)}
                          placeholder="Brief description" style={inputStyle()} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Business Email
                      </label>
                      <div style={fieldContainer(false)}>
                        <Icon name="book" size={16} color={C.ink3} />
                        <input type="email" value={bizEmail} onChange={e => setBizEmail(e.target.value)}
                          placeholder="business@email.com" style={inputStyle()} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Business Phone
                      </label>
                      <div style={fieldContainer(false)}>
                        <Icon name="phone" size={16} color={C.ink3} />
                        <input type="tel" value={bizPhone} onChange={e => setBizPhone(e.target.value)}
                          placeholder="+1 987 654 3210" style={inputStyle()} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Website Link
                      </label>
                      <div style={fieldContainer(false)}>
                        <Icon name="link" size={16} color={C.ink3} />
                        <input type="url" value={bizWebsite} onChange={e => setBizWebsite(e.target.value)}
                          placeholder="https://yourbusiness.com" style={inputStyle()} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn-int" onClick={goBack}
                style={{
                  flex: 1, height: 48, borderRadius: 12,
                  background: '#fff', border: `1.5px solid ${C.line}`,
                  color: C.ink, fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
                  fontFamily: F.ui, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="chevL" size={16} color={C.ink} style={{ marginRight: 6 }} />
                Back
              </button>
              <button type="button" className="btn-int" onClick={handleSendOtp} disabled={loading}
                style={{
                  flex: 2, height: 48, borderRadius: 12,
                  background: C.saffron, color: '#fff', border: `1px solid ${C.saffron}`,
                  fontSize: 14.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: F.ui, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(226,106,31,0.15)',
                }}
              >
                {loading ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite', marginRight: 4 }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                ) : null}
                Send OTP
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Verify ── */}
        {step === 'verify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 14, color: C.ink3, fontWeight: 500, textAlign: 'center' }}>
              An OTP has been sent to <strong>{email}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Enter OTP
              </label>
              <div style={fieldContainer(false)}>
                <Icon name="book" size={16} color={C.ink3} />
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                  placeholder="6-digit OTP" maxLength={6} style={inputStyle()} />
              </div>
            </div>

            <button type="button" className="btn-int" onClick={handleVerifyNext}
              style={{
                marginTop: 4, height: 48, borderRadius: 12, width: '100%',
                background: C.saffron, color: '#fff', border: `1px solid ${C.saffron}`,
                fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
                fontFamily: F.ui, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(226,106,31,0.15)',
              }}
            >
              Verify OTP
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 4 }}>
              <button type="button" className="btn-int" onClick={goBack}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: C.ink3,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}
              >
                <Icon name="chevL" size={14} color={C.ink3} />
                Back
              </button>
              <button type="button" className="btn-int" onClick={handleSendOtp} disabled={loading}
                style={{
                  background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', padding: 0,
                  fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: C.saffronDk,
                }}
              >
                {loading ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Password ── */}
        {step === 'password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 14, color: C.ink3, fontWeight: 500, textAlign: 'center' }}>
              OTP verified! Now set your password.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Password
              </label>
              <div style={fieldContainer(false)}>
                <Icon name="book" size={16} color={C.ink3} />
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" style={inputStyle()} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink3 }}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Confirm Password
              </label>
              <div style={fieldContainer(false)}>
                <Icon name="book" size={16} color={C.ink3} />
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" style={inputStyle()} />
              </div>
            </div>

            <button type="button" className="btn-int" onClick={handleComplete} disabled={loading}
              style={{
                marginTop: 4, height: 48, borderRadius: 12, width: '100%',
                background: C.saffron, color: '#fff', border: `1px solid ${C.saffron}`,
                fontSize: 14.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: F.ui, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(226,106,31,0.15)',
              }}
            >
              {loading ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite', marginRight: 4 }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              ) : null}
              Submit
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button type="button" className="btn-int" onClick={goBack}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: C.ink3,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}
              >
                <Icon name="chevL" size={14} color={C.ink3} />
                Back
              </button>
            </div>
          </div>
        )}

        <OrnamentDivider align="center" style={{ marginTop: 24 }} />

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: C.ink3, fontWeight: 500 }}>
          Already have a profile?{' '}
          <a href="/login" style={{ fontWeight: 700, color: C.saffronDk, textDecoration: 'none' }}>
            Sign in
          </a>
        </div>
      </Card>
    </div>
  );
}
