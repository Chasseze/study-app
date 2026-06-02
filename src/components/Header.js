import React from 'react';

function formatSync(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 4000) return 'Saved just now';
  if (diff < 60000) return 'Saved moments ago';
  if (diff < 3600000) return `Saved ${Math.floor(diff / 60000)}m ago`;
  return 'Synced';
}

export default function Header({
  resetButtonDescriptionId,
  setShowResetConfirm,
  theme,
  onToggleTheme,
  authUser,
  onSignOut,
  isSyncing,
  lastSyncTime
}) {
  const iconBtn = {
    background: 'transparent',
    color: 'var(--text-tertiary)',
    border: '1px solid var(--border-color)',
    padding: '0.5rem',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition-fast)'
  };

  return (
    <header
      data-testid="app-header"
      style={{
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--header-border)',
        padding: '0.85rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: 'var(--header-shadow)',
        position: 'relative',
        zIndex: 100,
        backdropFilter: 'saturate(180%) blur(12px)',
        WebkitBackdropFilter: 'saturate(180%) blur(12px)'
      }}
    >
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
        <div
          aria-hidden="true"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent)',
            color: '#fffdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: '1.25rem',
            lineHeight: 1,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          S
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              fontWeight: 600,
              letterSpacing: '-0.015em',
              margin: 0,
              color: 'var(--text-primary)'
            }}
          >
            Personal Study Note
          </h1>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.66rem',
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginTop: '0.15rem'
            }}
          >
            A calm place to think
          </span>
        </div>
      </div>

      {/* Right side controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {/* Cloud sync status */}
        <div
          title={isSyncing ? 'Syncing to cloud…' : formatSync(lastSyncTime) || 'Synced to cloud'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.6rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--text-tertiary)'
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isSyncing ? 'var(--highlight)' : 'var(--accent)',
              animation: isSyncing ? 'pulse 1s ease-in-out infinite' : 'none'
            }}
          />
          {isSyncing ? 'Syncing…' : 'Cloud'}
        </div>

        {/* Account */}
        {authUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span
              title={authUser.email || ''}
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                maxWidth: '140px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {authUser.email?.split('@')[0] || 'Account'}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              style={{ ...iconBtn, width: 'auto', padding: '0.4rem 0.7rem', fontSize: '0.72rem', fontWeight: 600 }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            >
              Sign out
            </button>
          </div>
        )}

        {/* Theme toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'}
          aria-label={'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'}
          style={iconBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--accent-border)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        {/* Reset button */}
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          title="Reset stored data"
          aria-describedby={resetButtonDescriptionId}
          aria-haspopup="dialog"
          style={{ ...iconBtn, color: 'var(--button-danger)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-danger)';
            e.currentTarget.style.color = '#fffdf8';
            e.currentTarget.style.borderColor = 'var(--button-danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--button-danger)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
