import React, { useState } from 'react';

// Full-screen, editorial sign-in gate. The app is cloud-only and requires an
// account so notes are durably tied to the signed-in user (no anonymous/local
// storage that could be orphaned or lost).
export default function AuthGate({ onGoogleSignIn, onEmailSignIn, error, theme, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onEmailSignIn(email, password);
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 0.85rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-ui)',
      position: 'relative'
    }}>
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'}
        title={'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'}
        style={{
          position: 'absolute', top: '1.25rem', right: '1.25rem',
          background: 'transparent', border: '1px solid var(--border-color)',
          color: 'var(--text-tertiary)', borderRadius: 'var(--radius-md)',
          padding: '0.5rem', cursor: 'pointer', display: 'flex'
        }}
      >
        {theme === 'light' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        )}
      </button>

      <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}>
        <div aria-hidden="true" style={{
          width: '52px', height: '52px', margin: '0 auto 1.25rem',
          borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fffdf8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.9rem', lineHeight: 1,
          boxShadow: 'var(--shadow-md)'
        }}>S</div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600,
          letterSpacing: '-0.02em', margin: '0 0 0.4rem', color: 'var(--text-primary)'
        }}>
          Personal Study Note
        </h1>
        <p style={{
          fontFamily: 'var(--font-serif)', fontSize: '1.05rem', lineHeight: 1.5,
          color: 'var(--text-tertiary)', margin: '0 0 1.75rem'
        }}>
          Sign in to open your notebook. Everything you write syncs securely to your account.
        </p>

        <button
          onClick={onGoogleSignIn}
          style={{
            width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
            color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', textAlign: 'left' }}>
          <input
            type="email" autoComplete="email" placeholder="you@example.com"
            aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle}
          />
          <input
            type="password" autoComplete="current-password" placeholder="Password"
            aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle}
          />
          {error && (
            <div role="alert" style={{
              padding: '0.5rem 0.75rem', backgroundColor: 'rgba(180,69,47,0.12)',
              borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--button-danger)'
            }}>
              {error}
            </div>
          )}
          <button
            type="submit" disabled={busy}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
              background: 'var(--button-primary)', color: '#fffdf8', border: 'none',
              fontWeight: 600, fontSize: '0.9rem', cursor: busy ? 'progress' : 'pointer',
              opacity: busy ? 0.7 : 1, boxShadow: 'var(--shadow-sm)'
            }}
          >
            {busy ? 'Signing in…' : 'Sign in with Email'}
          </button>
        </form>

        <p style={{ margin: '1.25rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          New here? Entering an email &amp; password creates your account automatically.
        </p>
      </div>
    </div>
  );
}
