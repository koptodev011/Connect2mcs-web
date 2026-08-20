'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  type AuthProvider,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import Icon from '@/components/Icon';
import { OrnamentDivider } from '@/components/Ornament';
import { Card, Modal, useGlobalToast } from '@/components/primitives';
import { auth, db } from '@/lib/firebase';
import { C } from '@/lib/tokens';
import styles from './page.module.css';

type SocialProviderName = 'google' | 'facebook' | 'linkedin';
type SocialIdentity = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

export default function LoginPage() {
  const router = useRouter();
  const toast = useGlobalToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);

  const triggerError = (message: string) => {
    toast.add(message, 'error');
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);
  };

  const navigateAfterLogin = (fallback = '/profile') => {
    window.dispatchEvent(new Event('mcs_auth_change'));
    const returnTo = localStorage.getItem('mcs_login_return');
    if (returnTo) localStorage.removeItem('mcs_login_return');
    router.push(returnTo || fallback);
  };

  const saveSocialUser = async (user: User, provider: SocialProviderName) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnapshot = await getDoc(userRef);
    const now = serverTimestamp();

    await setDoc(
      userRef,
      {
        uid: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        provider,
        is_online: true,
        lastSeen: now,
        updatedAt: now,
        ...(!userSnapshot.exists() ? { createdAt: now } : {}),
      },
      { merge: true },
    );
  };

  const getErpProfile = async (email: string) => {
    const response = await fetch(
      `/api/data/profile?username=${encodeURIComponent(email)}`,
      { cache: 'no-store' },
    );
    if (!response.ok) return null;
    const profiles = await response.json();
    return Array.isArray(profiles) ? profiles[0] || null : null;
  };

  const saveErpSession = (firebaseUser: SocialIdentity, providerName: SocialProviderName, erpProfile: Record<string, unknown> | null) => {
    const socialUser = {
      uid: firebaseUser.uid,
      id: erpProfile?.id || null,
      name: erpProfile?.name || firebaseUser.displayName || firebaseUser.email || 'Member',
      email: erpProfile?.email || firebaseUser.email || '',
      phone: erpProfile?.phone || '',
      city: erpProfile?.city || 'Unknown City',
      cityId: erpProfile?.cityId || '',
      country: erpProfile?.country || '',
      countryId: erpProfile?.countryId || '',
      loginType: erpProfile?.loginTypeId || erpProfile?.type || '',
      photoURL: firebaseUser.photoURL || '',
      provider: providerName,
    };
    localStorage.setItem('mcs_user', JSON.stringify(socialUser));
    localStorage.setItem('MCS_LoginType', String(socialUser.loginType));
    localStorage.setItem('mcs_location', JSON.stringify({ city: socialUser.city, cityId: socialUser.cityId, country: socialUser.country, countryId: socialUser.countryId }));
    window.dispatchEvent(new Event('mcs_location_change'));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedInStatus = params.get('linkedin');
    if (!linkedInStatus) return;

    const message = params.get('message');
    window.history.replaceState({}, '', '/login');
    if (linkedInStatus === 'error') {
      queueMicrotask(() => triggerError(message || 'LinkedIn sign-in failed.'));
      return;
    }

    const finishLinkedInLogin = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/auth/linkedin/session', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.profile) throw new Error(data.error || 'LinkedIn session expired.');
        const profile = data.profile as { sub: string; name?: string; email: string; picture?: string };
        const identity: SocialIdentity = {
          uid: `linkedin:${profile.sub}`,
          displayName: profile.name || null,
          email: profile.email,
          photoURL: profile.picture || null,
        };
        const erpProfile = await getErpProfile(profile.email);
        saveErpSession(identity, 'linkedin', erpProfile);
        toast.add('LinkedIn sign-in successful.', 'success');
        navigateAfterLogin('/');
      } catch (error) {
        triggerError(error instanceof Error ? error.message : 'LinkedIn sign-in failed.');
      } finally {
        setLoading(false);
      }
    };

    void finishLinkedInLogin();
    // OAuth callback must be consumed once when login page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSocialLogin = async (
    provider: AuthProvider,
    providerName: SocialProviderName,
  ) => {
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, provider);

      try {
        await saveSocialUser(credential.user, providerName);
      } catch (firestoreError) {
        console.error(`Failed to save ${providerName} user in Firestore:`, firestoreError);
      }

      const erpProfile = credential.user.email ? await getErpProfile(credential.user.email) : null;
      saveErpSession(credential.user, providerName, erpProfile);
      toast.add(`${providerName === 'google' ? 'Google' : 'Facebook'} sign-in successful.`, 'success');
      navigateAfterLogin('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : `${providerName} sign-in failed.`;
      triggerError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      const apiRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const apiData = await apiRes.json();
      if (!apiRes.ok || !apiData.success) {
        triggerError(apiData.error || 'API Authentication failed. Please try again.');
        return;
      }

      localStorage.setItem('mcs_user', JSON.stringify(apiData.user));
      const userLocation = {
        city: apiData.user.city || 'All',
        cityId: String(apiData.user.cityId || ''),
        country: apiData.user.country || 'All',
        countryId: String(apiData.user.countryId || ''),
      };
      localStorage.setItem('mcs_location', JSON.stringify(userLocation));
      document.cookie = `mcs_country=${encodeURIComponent(userLocation.country)}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `mcs_country_id=${encodeURIComponent(userLocation.countryId)}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(new Event('mcs_location_change'));
      localStorage.setItem('MCS_LoginType', String(apiData.user.loginType || ''));
      ['MCS_Maid_ID', 'MCS_Mentor_ID', 'MCS_TaxiDriver_ID', 'MCS_TiffinProvider_ID'].forEach((key) => {
        const profileId = apiData.user.linkedProfileIds?.[key];
        if (profileId) localStorage.setItem(key, String(profileId));
        else localStorage.removeItem(key);
      });
      if (apiData.token) localStorage.setItem('mcs_token', apiData.token);

      const firebaseEmail = username.includes('@') ? username.trim() : `${username.trim()}@connect2mcs.com`;
      let firebaseSuccess = false;
      try {
        await signInWithEmailAndPassword(auth, firebaseEmail, password);
        firebaseSuccess = true;
      } catch (firebaseError: unknown) {
        const code = typeof firebaseError === 'object' && firebaseError && 'code' in firebaseError
          ? String(firebaseError.code)
          : '';
        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, firebaseEmail, password);
            firebaseSuccess = true;
          } catch (registrationError) {
            console.error('Firebase automatic registration failed:', registrationError);
          }
        } else {
          console.error('Firebase login error:', firebaseError);
        }
      }

      if (auth.currentUser) {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userSnapshot = await getDoc(userRef);
          await setDoc(userRef, {
            uid: auth.currentUser.uid,
            name: apiData.user.name,
            email: auth.currentUser.email || firebaseEmail.toLowerCase(),
            erpUserId: String(apiData.user.id || ''),
            adUserId: String(apiData.user.id || ''),
            role: 'New Member',
            city: apiData.user.city || 'Boston, USA',
            mandal: 'General Mandal',
            open: 'Networking',
            conn: '0 mutual',
          }, { merge: true });
          if (!userSnapshot.exists()) console.log(`Registered user profile in users collection: ${apiData.user.name}`);
        } catch (databaseError) {
          console.error('Failed to verify/register user profile in Firestore:', databaseError);
        }
      }

      toast.add(
        firebaseSuccess
          ? `Success! Logged in with API & Firebase. Welcome back, ${apiData.user.name}!`
          : `Logged in with API, but Firebase auth failed. Welcome back, ${apiData.user.name}!`,
        firebaseSuccess ? 'success' : 'info',
      );
      navigateAfterLogin();
    } catch (error) {
      console.error(error);
      triggerError(error instanceof Error ? error.message : 'Connection failed. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = (role: string) => {
    setGuestDialogOpen(false);
    localStorage.setItem('mcs_user', JSON.stringify({ name: `${role} (Guest)`, role, isGuest: true }));
    window.dispatchEvent(new Event('mcs_auth_change'));
    toast.add(`Signed in as ${role}. Explore freely!`, 'success');
    router.push('/');
  };

  const divider = (text: string) => (
    <div className={styles.divider}>
      <div className={styles.line} />
      <div className={styles.dividerText}>{text}</div>
      <div className={styles.line} />
    </div>
  );

  return (
    <div className={styles.page}>
      <Card className={`${styles.card} ${errorShake ? styles.shake : ''}`} pad={36}>
        <div className={styles.header}>
          <div className={styles.avatar}><Icon name="user" size={24} color={C.saffronDk} /></div>
          <h2 className={styles.title}>Sign In</h2>
          <div className={styles.subtitle}>
            <span>l</span>
            <span className={styles.marathi}>à¤²à¥‰à¤—à¤¿à¤¨</span>
            <span>l</span>
            <span>Connect to your community</span>
          </div>
        </div>

        <OrnamentDivider align="center" />

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Username or Email</label>
            <div className={styles.inputWrap}>
              <Icon name="people" size={16} color={C.ink3} />
              <input className={styles.input} type="text" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="e.g. Umesh Gadave" disabled={loading} />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Password</label>
              <a href="#forgot" className={styles.forgot} onClick={(event) => { event.preventDefault(); toast.add('Password reset simulated. Use any password.', 'info'); }}>Forgot?</a>
            </div>
            <div className={styles.inputWrap}>
              <Icon name="book" size={16} color={C.ink3} />
              <input className={styles.input} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" disabled={loading} />
              <button type="button" className={styles.reveal} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'HIDE' : 'SHOW'}</button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`btn-int ${styles.button} ${styles.submit}`}>
            {loading ? <span className={styles.loading}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={styles.spinner}><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>Signing in...</span> : 'Sign In'}
          </button>
        </form>

        {divider('Or continue with')}
        <div className={styles.socials}>
          <button type="button" disabled={loading} className={`btn-int ${styles.button} ${styles.social} ${styles.google}`} onClick={() => handleSocialLogin(new GoogleAuthProvider(), 'google')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Google
          </button>
          <button type="button" disabled={loading} className={`btn-int ${styles.button} ${styles.social} ${styles.facebook}`} onClick={() => handleSocialLogin(new FacebookAuthProvider(), 'facebook')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            Facebook
          </button>
          <button type="button" disabled={loading} className={`btn-int ${styles.button} ${styles.social} ${styles.linkedin}`} onClick={() => window.location.assign('/api/auth/linkedin')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            LinkedIn
          </button>
        </div>

        {divider('Or explore as guest')}
        <button type="button" className={`btn-int ${styles.button} ${styles.guest}`} onClick={() => setGuestDialogOpen(true)}><Icon name="user" size={16} color={C.saffronDk} />Continue as Guest</button>

        <Modal isOpen={guestDialogOpen} onClose={() => setGuestDialogOpen(false)} title="Continue as Guest" marathi="à¤ªà¤¾à¤¹à¥à¤£à¤¾ à¤®à¥à¤¹à¤£à¥‚à¤¨ à¤¸à¥à¤°à¥‚ à¤ à¥‡à¤µà¤¾" width={400}>
          <div className={`${styles.guestOptions} ${styles.modalBody}`}>
            {['Student', 'Entrepreneur', 'NRI Member'].map((role) => <button key={role} type="button" className={`btn-int ${styles.button} ${styles.guestOption}`} onClick={() => handleGuestLogin(role)}><Icon name="user" size={18} color={C.saffronDk} />{role}</button>)}
          </div>
        </Modal>

        <div className={styles.signup}>Don&rsquo;t have a profile?{' '}<a href="/register" className={styles.signupLink}>Create one</a></div>
      </Card>
    </div>
  );
}
