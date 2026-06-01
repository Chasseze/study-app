import React from 'react';
import { BookIcon, StorageIcon } from './icons';

export default function Header({
  storageSelectId,
  storageSelectLabelId,
  storageKey,
  storageOptions,
  isSwitchingStorage,
  handleStorageChange,
  storageDescription,
  resetButtonDescriptionId,
  setShowResetConfirm,
  theme,
  onToggleTheme
}) {
  return (
    <header
      data-testid="app-header"
      style={{
        height: 60,
        flexShrink: 0,
        background: 'var(--header-gradient)',
        borderBottom: '1px solid var(--header-border)',
        padding: '0 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: 'var(--header-shadow)',
        position: 'relative',
        zIndex: 100
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div style={{
          width: 34, height: 34,
          background: 'var(--accent)',
          color: 'var(--fg-on-accent)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
          flexShrink: 0
        }}>
          <BookIcon />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{
            fontSize: '0.9375rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)'
          }}>Study Notes</span>
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)'
          }}>Your study space</span>
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Storage chip */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            boxShadow: 'var(--shadow-xs)'
          }}
          title={storageDescription}
        >
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--success)',
            flexShrink: 0
          }} />
          <span style={{ color: 'var(--text-muted)', display: 'flex' }}>
            <StorageIcon />
          </span>
          <label htmlFor={storageSelectId} id={storageSelectLabelId} style={{ position: 'absolute', left: -9999 }}>
            Choose where notes are stored
          </label>
          <select
            id={storageSelectId}
            aria-labelledby={storageSelectLabelId}
            value={storageKey}
            onChange={handleStorageChange}
            disabled={isSwitchingStorage}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontFamily: 'inherit',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: isSwitchingStorage ? 'progress' : 'pointer',
              outline: 'none',
              padding: 0
            }}
          >
            {storageOptions.map(option => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          style={{
            width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            color: 'var(--text-tertiary)',
            border: '1px solid transparent',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4.2"/>
              <line x1="12" y1="2" x2="12" y2="4.5"/>
              <line x1="12" y1="19.5" x2="12" y2="22"/>
              <line x1="4.2" y1="4.2" x2="6" y2="6"/>
              <line x1="18" y1="18" x2="19.8" y2="19.8"/>
              <line x1="2" y1="12" x2="4.5" y2="12"/>
              <line x1="19.5" y1="12" x2="22" y2="12"/>
              <line x1="4.2" y1="19.8" x2="6" y2="18"/>
              <line x1="18" y1="6" x2="19.8" y2="4.2"/>
            </svg>
          )}
        </button>

        {/* Reset (icon-only) */}
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          title="Reset stored data"
          aria-describedby={resetButtonDescriptionId}
          aria-haspopup="dialog"
          style={{
            width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid transparent',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--danger-soft)';
            e.currentTarget.style.color = 'var(--danger-fg)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
