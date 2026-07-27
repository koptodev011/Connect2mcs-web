'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Card, Modal, useGlobalToast } from '@/components/primitives';
import { OrnamentDivider } from '@/components/Ornament';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const toast = useGlobalToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      triggerError('Please fill in all fields.');
      return;
    }

    if (password.length < 4) {
      triggerError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);

    try {
      // 1. Perform API login first
      const apiRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const apiData = await apiRes.json();

      if (!apiRes.ok || !apiData.success) {
        triggerError(apiData.error || 'API Authentication failed. Please try again.');
        setLoading(false);
        return;
      }

      // API login succeeded - save user details
      localStorage.setItem('mcs_user', JSON.stringify(apiData.user));
      if (apiData.token) {
        localStorage.setItem('mcs_token', apiData.token);
      }

      // 2. Perform Firebase login
      const emailForFirebase = username.includes('@') ? username.trim() : `${username.trim()}@connect2mcs.com`;
      let fbSuccess = false;

      try {
        console.log(`🔥 Attempting Firebase auth for: ${emailForFirebase}`);
        const userCredential = await signInWithEmailAndPassword(auth, emailForFirebase, password);
        console.log("✅ Firebase login successful:", userCredential.user);
        fbSuccess = true;
      } catch (fbError: any) {
        console.warn("⚠️ Firebase login failed, checking error code:", fbError.code);
        // 'auth/user-not-found' or 'auth/invalid-credential' can occur if the user doesn't exist yet
        if (fbError.code === 'auth/user-not-found' || fbError.code === 'auth/invalid-credential') {
          try {
            console.log(`🌱 Creating user in Firebase on-the-fly: ${emailForFirebase}`);
            const registerCredential = await createUserWithEmailAndPassword(auth, emailForFirebase, password);
            console.log("✅ Firebase registration & login successful:", registerCredential.user);
            fbSuccess = true;
          } catch (regError: any) {
            console.error("❌ Firebase automatic registration failed:", regError);
          }
        } else {
          console.error("❌ Firebase login error:", fbError);
        }
      }

      // 3. Register user in users collection in Firestore if not already present
      if (auth.currentUser) {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: auth.currentUser.uid,
              name: apiData.user.name,
              role: 'New Member',
              city: apiData.user.city || 'Boston, USA',
              mandal: 'General Mandal',
              open: 'Networking',
              conn: '0 mutual'
            });
            console.log(`✅ Registered user profile in users collection: ${apiData.user.name}`);
          }
        } catch (dbErr) {
          console.error("❌ Failed to verify/register user profile in Firestore:", dbErr);
        }
      }

      if (fbSuccess) {
        toast.add(`Success! Logged in with API & Firebase. Welcome back, ${apiData.user.name}!`, 'success');
      } else {
        toast.add(`Logged in with API, but Firebase auth failed. Welcome back, ${apiData.user.name}!`, 'info');
      }

      // Dispatch custom event to notify Header.tsx instantly
      window.dispatchEvent(new Event('mcs_auth_change'));
      router.push('/profile');

    } catch (err: any) {
      console.error(err);
      triggerError(err.message || 'Connection failed. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = (role: string) => {
    setGuestDialogOpen(false);
    const guestUser = {
      name: `${role} (Guest)`,
      role,
      isGuest: true,
    };
    localStorage.setItem('mcs_user', JSON.stringify(guestUser));
    window.dispatchEvent(new Event('mcs_auth_change'));
    toast.add(`Signed in as ${role}. Explore freely!`, 'success');
    router.push('/');
  };

  const triggerError = (msg: string) => {
    toast.add(msg, 'error');
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 180px)',
      padding: '24px 16px',
    }}>
      {/* CSS Animation Keyframes for premium error shaking */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .shake-element {
          animation: shake 0.4s ease-in-out;
        }
      `}} />

      <Card
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#fff',
          border: `1px solid ${C.line}`,
          boxShadow: '0 12px 40px rgba(15,14,12,0.06)',
          borderRadius: 20,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        className={errorShake ? 'shake-element' : ''}
        pad={36}
      >
        {/* Cultural Accent Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 14,
            background: C.saffronLt,
            color: C.saffronDk,
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(226,106,31,0.1)'
          }}>
            <Icon name="user" size={24} color={C.saffronDk} />
          </div>
          <h2 style={{
            margin: '0 0 6px',
            fontFamily: F.display,
            fontSize: 26,
            fontWeight: 700,
            color: C.ink,
            letterSpacing: '-0.02em',
          }}>
            Sign In
          </h2>
          <div style={{
            fontSize: 13.5,
            color: C.ink3,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}>
            <span>l</span>
            <span style={{ color: C.saffronDk, fontWeight: 700 }}>लॉगिन</span>
            <span>l</span>
            <span>Connect to your community</span>
          </div>
        </div>

        <OrnamentDivider align="center" />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
          {/* Username Input Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Username or Email
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              background: C.bgDeep,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              transition: 'all 0.2s',
            }} onFocus={e => {
              e.currentTarget.style.borderColor = C.saffron;
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(226,106,31,0.08)';
            }} onBlur={e => {
              e.currentTarget.style.borderColor = C.line;
              e.currentTarget.style.background = C.bgDeep;
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <Icon name="people" size={16} color={C.ink3} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. Umesh Gadave"
                disabled={loading}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  color: C.ink,
                  fontFamily: F.ui,
                }}
              />
            </div>
          </div>

          {/* Password Input Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Password
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); toast.add('Password reset simulated. Use any password.', 'info'); }} style={{ fontSize: 12, fontWeight: 600, color: C.saffronDk, textDecoration: 'none' }}>
                Forgot?
              </a>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              background: C.bgDeep,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              transition: 'all 0.2s',
            }} onFocus={e => {
              e.currentTarget.style.borderColor = C.saffron;
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(226,106,31,0.08)';
            }} onBlur={e => {
              e.currentTarget.style.borderColor = C.line;
              e.currentTarget.style.background = C.bgDeep;
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <Icon name="book" size={16} color={C.ink3} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  color: C.ink,
                  fontFamily: F.ui,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: C.ink3 }}>
                  {showPassword ? 'HIDE' : 'SHOW'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-int"
            style={{
              marginTop: 8,
              height: 48,
              borderRadius: 12,
              background: C.saffron,
              color: '#fff',
              border: `1px solid ${C.saffron}`,
              fontSize: 14.5,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: F.ui,
              opacity: loading ? 0.85 : 1,
              width: '100%',
              boxShadow: '0 4px 12px rgba(226,106,31,0.15)'
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                {/* Visual loading spinner */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="spinner-loader" style={{
                  animation: 'spin 1s linear infinite',
                  marginRight: 4
                }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <style dangerouslySetInnerHTML={{
                  __html: `
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}} />
                Signing in...
              </div>
            ) : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: C.line }}></div>
          <div style={{ padding: '0 12px', fontSize: 12, color: C.ink3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Or continue with</div>
          <div style={{ flex: 1, height: 1, background: C.line }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            className="btn-int"
            onClick={(e) => { e.preventDefault(); toast.add('Google login simulated.', 'info'); }}
            style={{
              height: 44, borderRadius: 12, background: '#fff', border: `1.5px solid ${C.line}`,
              color: C.ink, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s',
              fontFamily: F.ui
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>

          <button
            type="button"
            className="btn-int"
            onClick={(e) => { e.preventDefault(); toast.add('Facebook login simulated.', 'info'); }}
            style={{
              height: 44, borderRadius: 12, background: '#1877F2', border: '1.5px solid #1877F2',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s',
              fontFamily: F.ui
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>

          <button
            type="button"
            className="btn-int"
            onClick={(e) => { e.preventDefault(); toast.add('LinkedIn login simulated.', 'info'); }}
            style={{
              height: 44, borderRadius: 12, background: '#0A66C2', border: '1.5px solid #0A66C2',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s',
              fontFamily: F.ui
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: C.line }}></div>
          <div style={{ padding: '0 12px', fontSize: 12, color: C.ink3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Or explore as guest</div>
          <div style={{ flex: 1, height: 1, background: C.line }}></div>
        </div>

        <button
          type="button"
          className="btn-int"
          onClick={() => setGuestDialogOpen(true)}
          style={{
            height: 44,
            borderRadius: 12,
            background: '#fff',
            border: `1.5px dashed ${C.saffron}`,
            color: C.saffronDk,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
            fontFamily: F.ui,
            width: '100%',
          }}
        >
          <Icon name="user" size={16} color={C.saffronDk} />
          Continue as Guest
        </button>

        <Modal isOpen={guestDialogOpen} onClose={() => setGuestDialogOpen(false)} title="Continue as Guest" marathi="पाहुणा म्हणून सुरू ठेवा" width={400}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 0 8px' }}>
            {['Student', 'Entrepreneur', 'NRI Member'].map(role => (
              <button
                key={role}
                type="button"
                className="btn-int"
                onClick={() => handleGuestLogin(role)}
                style={{
                  height: 48,
                  borderRadius: 12,
                  background: C.bgDeep,
                  border: `1.5px solid ${C.line}`,
                  color: C.ink,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'all 0.2s',
                  fontFamily: F.ui,
                }}
              >
                <Icon name="user" size={18} color={C.saffronDk} />
                {role}
              </button>
            ))}
          </div>
        </Modal>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: C.ink3, fontWeight: 500 }}>
          Don&rsquo;t have a profile?{' '}
          <a href="/register" style={{ fontWeight: 700, color: C.saffronDk, textDecoration: 'none' }}>
            Create one
          </a>
        </div>
      </Card>
    </div>
  );
}
