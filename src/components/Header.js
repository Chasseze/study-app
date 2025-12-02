import React, { useEffect, useRef, useState } from 'react';
import { BookIcon, StorageIcon } from './icons';
import Modal from './Modal';
import { isConfigured, onAuthChange, signInWithGoogle, signOut } from '../lib/firebaseClient';

export default function Header({
  storageSelectId,
  storageSelectLabelId,
  storageKey,
  storageOptions,
  isSwitchingStorage,
  handleStorageChange,
  storageDescription,
  storageShortLabel,
  resetButtonDescriptionId,
  setShowResetConfirm,
  theme,
  onToggleTheme
}) {
  const [user, setUser] = useState(null);
  const firebaseEnabled = isConfigured();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
    });
    return () => unsub && unsub();
  }, []);
  return (
    <header data-testid="app-header" style={{
      background: 'linear-gradient(135deg, #008751 0%, #008751 33%, #ffffff 33%, #ffffff 66%, #008751 66%, #008751 100%)',
      border: '3px solid #008751',
  padding: '0.4rem 1.1rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.35rem',
  boxShadow: '0 2px 4px -2px rgba(0,0,0,0.06)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <BookIcon />
        <h1 style={{ color: '#002b12', fontSize: '1.6rem', fontWeight: '700', letterSpacing: '0.15px', margin: 0 }}>
          Personal Study Note
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div aria-describedby={storageDescription} title={storageDescription} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#07121a',
              backgroundColor: '#ffffff',
              borderRadius: '0.35rem',
              padding: '0.08rem 0.45rem',
              border: '1px solid rgba(7,18,26,0.06)'
            }}
          >
          <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', color: '#475569' }}>
            <StorageIcon />
          </span>
          <span style={{ display: 'none' }}>Active storage</span>
          <span style={{ marginLeft: '0.15rem' }}>{storageShortLabel}</span>
        </div>

        <label htmlFor={storageSelectId} id={storageSelectLabelId} style={{ display: 'none' }}>
          Choose where notes are stored
        </label>
        <select
          id={storageSelectId}
          aria-labelledby={storageSelectLabelId}
          value={storageKey}
          onChange={handleStorageChange}
          disabled={isSwitchingStorage}
          style={{
            fontSize: '0.75rem',
            borderRadius: '0.25rem',
            border: '1px solid rgba(7,18,26,0.08)',
            backgroundColor: '#ffffff',
            padding: '0.12rem 0.32rem',
            color: '#07121a',
            cursor: isSwitchingStorage ? 'progress' : 'pointer',
            minWidth: '3.8rem'
          }}
          title="Switch storage backend"
        >
          {storageOptions.map(option => (
            <option key={option.key} value={option.key}>
              {option.shortLabel}
            </option>
          ))}
        </select>

          <div style={{ display: 'flex', gap: '0.18rem', alignItems: 'center' }}>
            {firebaseEnabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem', marginLeft: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{ width: 10, height: 10, borderRadius: 999, background: user ? '#10b981' : 'transparent', border: user ? 'none' : '1px solid #94a3b8' }}
                    title={user ? (user.email || `UID: ${user.uid}`) : 'Not signed in'}
                    role="img"
                    aria-label={user ? `Signed in as ${user.email || `UID: ${user.uid}`}` : 'Not signed in'}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#07121a' }}>
                    {user ? (user.email || `UID:${user.uid}`) : 'Not signed in'}
                  </div>
                </div>
                <div>
                  {!user ? (
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button
                        onClick={() => signInWithGoogle().catch(() => {})}
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', border: '1px solid rgba(7,18,26,0.06)', background: '#fff', cursor: 'pointer' }}
                      >
                        Sign in
                      </button>
                      <button
                        onClick={() => setShowEmailForm(true)}
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', border: '1px solid rgba(7,18,26,0.06)', background: '#fff', cursor: 'pointer' }}
                      >
                        Email
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => signOut().catch(() => {})}
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', border: '1px solid rgba(7,18,26,0.06)', background: '#fff', cursor: 'pointer' }}
                    >
                      Sign out
                    </button>
                  )}
                </div>
              </div>
            )}
            <div style={{ minWidth: 48, textAlign: 'right' }} role="status" aria-live="polite" aria-atomic="true">{/** placeholder for saved status **/}</div>
            {showEmailForm && (
              <Modal onClose={() => setShowEmailForm(false)} labelledBy="email-auth-heading" initialFocusRef={emailRef}>
                <h2 id="email-auth-heading" style={{ margin: 0, marginBottom: '0.75rem', fontSize: '1.125rem', fontWeight: 700 }}>Sign in with email</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    id="email-auth-email"
                    name="email"
                    ref={emailRef}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    defaultValue={email}
                    style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid rgba(7,18,26,0.08)' }}
                  />
                  <input
                    id="email-auth-password"
                    name="password"
                    ref={passwordRef}
                    type="password"
                    placeholder="password"
                    autoComplete="new-password"
                    defaultValue={password}
                    style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid rgba(7,18,26,0.08)' }}
                  />
                  {emailError && <div style={{ color: '#ef4444' }}>{emailError}</div>}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                          import('../lib/firebaseClient').then(async (mod) => {
                            setEmailError('');
                            const e = emailRef.current ? emailRef.current.value.trim() : '';
                            const p = passwordRef.current ? passwordRef.current.value : '';
                            if (!e || !p) {
                              setEmailError('Please enter email and password');
                              return;
                            }
                            try {
                              await mod.signInWithEmail(e, p);
                            } catch (err) {
                              // Try create account; surface error messages so users know why it failed
                              try {
                                await mod.createUserWithEmail(e, p);
                              } catch (err2) {
                                console.warn('Email auth failed', err, err2);
                                // prefer err2 message if present
                                setEmailError((err2 && err2.message) || (err && err.message) || 'Sign in failed');
                                return;
                              }
                            }
                            if (emailRef.current) emailRef.current.value = '';
                            if (passwordRef.current) passwordRef.current.value = '';
                            setEmail(''); setPassword(''); setEmailError(''); setShowEmailForm(false);
                          }).catch((dynamicErr) => {
                            console.warn('Failed to load firebaseClient', dynamicErr);
                            setEmailError('Authentication unavailable');
                          });
                        }}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#4f46e5', color: 'white', border: 'none' }}
                    >
                      Sign in / Create
                    </button>
                    <button onClick={() => setShowEmailForm(false)} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: '#e2e8f0', border: 'none' }}>Cancel</button>
                  </div>
                </div>
              </Modal>
            )}
            <button
              type="button"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              style={{
                background: 'transparent',
                color: '#07121a',
                border: '1px solid rgba(7,18,26,0.06)',
                padding: '0.22rem',
                borderRadius: '0.32rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(7,18,26,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              title="Reset stored data"
              aria-describedby={resetButtonDescriptionId}
              aria-haspopup="dialog"
              aria-expanded={false}
              style={{
                background: 'transparent',
                color: '#07121a',
                border: '1px solid rgba(7,18,26,0.06)',
                padding: '0.22rem',
                borderRadius: '0.32rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(7,18,26,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
