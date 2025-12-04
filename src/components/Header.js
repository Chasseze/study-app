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
  const borderColor = theme === 'dark' ? '#047857' : '#008751';

  return (
    <header 
      data-testid="app-header" 
      style={{
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #047857 0%, #047857 25%, #1e293b 25%, #1e293b 75%, #047857 75%, #047857 100%)'
          : 'linear-gradient(135deg, #008751 0%, #008751 25%, #ffffff 25%, #ffffff 75%, #008751 75%, #008751 100%)',
        borderBottom: '3px solid ' + borderColor,
        padding: '0.5rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 2px 8px -2px rgba(0,0,0,0.1)'
      }}
    >
      {/* Logo and title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div 
          style={{ 
            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            padding: '0.4rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <BookIcon />
        </div>
        <h1 
          style={{ 
            color: theme === 'dark' ? '#f1f5f9' : '#002b12', 
            fontSize: '1.35rem', 
            fontWeight: '700', 
            letterSpacing: '-0.01em', 
            margin: 0,
            textShadow: theme === 'dark' ? 'none' : '0 1px 2px rgba(255,255,255,0.8)'
          }}
        >
          Personal Study Note
        </h1>
      </div>

      {/* Right side controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Storage selector */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: '0.5rem',
            padding: '0.25rem 0.5rem',
            border: '1px solid rgba(148,163,184,0.3)',
            gap: '0.35rem'
          }}
          title={storageDescription}
        >
          <span style={{ color: '#64748b', display: 'flex' }}>
            <StorageIcon />
          </span>
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
              fontWeight: 600,
              border: 'none',
              backgroundColor: 'transparent',
              color: '#1e293b',
              cursor: isSwitchingStorage ? 'progress' : 'pointer',
              outline: 'none',
              paddingRight: '0.25rem'
            }}
          >
            {storageOptions.map(option => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'}
          aria-label={'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'}
          style={{
            background: 'rgba(255,255,255,0.95)',
            color: '#1e293b',
            border: '1px solid rgba(148,163,184,0.3)',
            padding: '0.4rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
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
          style={{
            background: 'rgba(255,255,255,0.95)',
            color: '#ef4444',
            border: '1px solid rgba(148,163,184,0.3)',
            padding: '0.4rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.95)';
            e.currentTarget.style.color = '#ef4444';
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
